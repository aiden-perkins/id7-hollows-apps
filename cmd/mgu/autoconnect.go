package main

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
	"sort"
	"strings"
	"time"
)

// ENET discovery and the head unit IP read are implemented directly in Go.
const enetDiscoveryTimeout = 3 * time.Second

type enetGateway struct { ip, vin string }

func carVIN(value string) string {
	value = strings.ToUpper(strings.TrimSpace(value))
	if len(value) != 17 { return "" }
	for _, c := range value {
		if !(c >= 'A' && c <= 'Z' || c >= '0' && c <= '9') || strings.ContainsRune("IOQ", c) { return "" }
	}
	return value
}

func usableCarIP(ip net.IP) bool {
	return ip != nil && ip.To4() != nil && !ip.IsUnspecified() && !ip.IsLoopback() && !ip.IsMulticast() && !ip.Equal(net.IPv4bcast)
}

func (a *application) autoConnect() error {
	if a.port < 0 || a.port > 65535 { return errors.New("SSH port must be between 1 and 65535") }
	vin := carVIN(a.vin)
	if a.vin != "" && vin == "" { return errors.New("--vin must be a valid 17-character VIN") }
	if a.host != "" { return nil }
	var gateways []enetGateway
	if a.gateway != "" {
		if vin != "" { return errors.New("--vin requires broadcast discovery; use --gateway without --vin") }
		if !usableCarIP(net.ParseIP(a.gateway)) { return errors.New("--gateway must be an IPv4 address") }
		gateways = []enetGateway{{ip: net.ParseIP(a.gateway).String()}}
	} else {
		fmt.Fprintln(a.err, "Discovering the ENET gateway...")
		var err error
		gateways, err = discoverENET(a.ctx)
		if err != nil { return fmt.Errorf("auto-discovery: %w; use --gateway IP or --host root@IP", err) }
	}
	if vin != "" {
		var matching []enetGateway
		for _, gateway := range gateways { if gateway.vin == vin { matching = append(matching, gateway) } }
		if len(matching) == 0 { return errors.New("the discovered car does not match --vin") }
		gateways = matching
	}
	if len(gateways) != 1 { return errors.New("multiple ENET gateways responded; select --vin VIN or --gateway IP") }
	fmt.Fprintf(a.err, "Reading the head unit IP through gateway %s...\n", gateways[0].ip)
	ip, err := readHeadUnitIP(a.ctx, gateways[0].ip)
	if err != nil { return fmt.Errorf("head unit IP read: %w; use --host root@IP", err) }
	if err := a.ctx.Err(); err != nil { return err }
	a.host = "root@" + ip
	fmt.Fprintf(a.err, "Auto connection: %s\n", a.host)
	return nil
}

func discoverENET(parent context.Context) ([]enetGateway, error) {
	ctx, cancel := context.WithTimeout(parent, enetDiscoveryTimeout)
	defer cancel()
	interfaces, err := net.Interfaces()
	if err != nil { return nil, err }
	type probe struct { local net.IP; broadcast net.IP }
	var probes []probe
	var failures []error
	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 { continue }
		addresses, err := iface.Addrs()
		if err != nil { failures = append(failures, err); continue }
		for _, address := range addresses {
			network, ok := address.(*net.IPNet)
			if !ok || network.IP.To4() == nil { continue }
			ip := network.IP.To4()
			ones, bits := network.Mask.Size()
			if bits != 32 || ones > 30 { continue }
			broadcast := make(net.IP, 4)
			for i := range broadcast { broadcast[i] = ip[i] | ^network.Mask[i] }
			probes = append(probes, probe{ip, broadcast})
		}
	}
	if len(probes) == 0 { probes = append(probes, probe{net.IPv4zero, net.IPv4bcast}) }
	type reply struct { gateways []enetGateway; err error }
	replies := make(chan reply, len(probes))
	started := 0
	deadline, _ := ctx.Deadline()
	for _, probe := range probes {
		connection, err := net.ListenUDP("udp4", &net.UDPAddr{IP: probe.local})
		if err != nil { failures = append(failures, err); continue }
		if err := connection.SetWriteDeadline(deadline); err != nil { failures = append(failures, err); connection.Close(); continue }
		sent := false
		for _, target := range []net.IP{probe.broadcast, net.IPv4bcast, net.IPv4(169, 254, 255, 255)} {
			if _, err := connection.WriteToUDP([]byte{0, 0, 0, 0, 0, 0x11}, &net.UDPAddr{IP: target, Port: 6811}); err == nil { sent = true } else { failures = append(failures, err) }
		}
		if !sent { connection.Close(); continue }
		started++
		go func(connection *net.UDPConn) {
			defer connection.Close()
			var found []enetGateway
			var buffer [4096]byte
			for ctx.Err() == nil {
				if err := connection.SetReadDeadline(time.Now().Add(100*time.Millisecond)); err != nil { replies <- reply{found, err}; return }
				n, from, err := connection.ReadFromUDP(buffer[:])
				if err != nil {
					if timeout, ok := err.(net.Error); ok && timeout.Timeout() { continue }
					replies <- reply{found, err}; return
				}
				text := bytes.ReplaceAll(buffer[:n], []byte{0}, nil)
				marker := bytes.Index(text, []byte("BMWVIN"))
				if marker < 0 || len(text) < marker+23 { continue }
				vin := carVIN(string(text[marker+6:marker+23]))
				if vin != "" && usableCarIP(from.IP) { found = append(found, enetGateway{from.IP.String(), vin}) }
			}
			replies <- reply{gateways: found}
		}(connection)
	}
	found := map[string]enetGateway{}
	for i := 0; i < started; i++ {
		reply := <-replies
		if reply.err != nil { failures = append(failures, reply.err) }
		for _, gateway := range reply.gateways { found[gateway.ip] = gateway }
	}
	if err := parent.Err(); err != nil { return nil, err }
	var result []enetGateway
	for _, gateway := range found { result = append(result, gateway) }
	sort.Slice(result, func(i, j int) bool { return result[i].ip < result[j].ip })
	if len(result) == 0 { return nil, errors.Join(append([]error{errors.New("no ENET gateway responded")}, failures...)...) }
	return result, nil
}

func readHeadUnitIP(parent context.Context, gateway string) (string, error) {
	ctx, cancel := context.WithTimeout(parent, enetDiscoveryTimeout)
	defer cancel()
	connection, err := (&net.Dialer{}).DialContext(ctx, "tcp4", net.JoinHostPort(gateway, "6801"))
	if err != nil { return "", err }
	defer connection.Close()
	deadline, _ := ctx.Deadline()
	if err := connection.SetDeadline(deadline); err != nil { return "", err }
	request := []byte{0, 0, 0, 5, 0, 1, 0xF4, 0x63, 0x22, 0x17, 0x2A}
	if _, err := io.Copy(connection, bytes.NewReader(request)); err != nil { return "", err }
	for {
		var header [6]byte
		if _, err := io.ReadFull(connection, header[:]); err != nil { return "", err }
		length, kind := binary.BigEndian.Uint32(header[:4]), binary.BigEndian.Uint16(header[4:])
		if length < 2 || length > 1<<20 { return "", errors.New("invalid HSFZ frame length") }
		body := make([]byte, int(length))
		if _, err := io.ReadFull(connection, body); err != nil { return "", err }
		if kind == 0xFF { return "", errors.New("ENET gateway rejected the IP read request") }
		if kind != 1 || body[0] != 0x63 || body[1] != 0xF4 { continue }
		data := body[2:]
		if len(data) >= 3 && data[0] == 0x7F && data[1] == 0x22 {
			if data[2] == 0x78 { continue }
			return "", fmt.Errorf("head unit rejected the IP read: NRC 0x%02X", data[2])
		}
		if len(data) < 16 || !bytes.Equal(data[:4], []byte{0x62, 0x17, 0x2A, 0}) { continue }
		ip := net.IP(data[4:8])
		if !usableCarIP(ip) { return "", errors.New("head unit returned an unusable IPv4 address") }
		return ip.String(), nil
	}
}
