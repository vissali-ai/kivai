// Build with the Windows .NET Framework C# compiler. No third-party runtime required.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

class KivaiConnect {
    const int Port = 47831;
    static readonly JavaScriptSerializer Json = new JavaScriptSerializer();
    static string Adb;
    static bool PrivateIp(string value) {
        if (!Regex.IsMatch(value, @"^\d{1,3}(\.\d{1,3}){3}$")) return false;
        IPAddress ip; if (!IPAddress.TryParse(value, out ip)) return false;
        byte[] b = ip.GetAddressBytes();
        return b.Length == 4 && (b[0] == 10 || b[0] == 192 && b[1] == 168 || b[0] == 172 && b[1] >= 16 && b[1] <= 31);
    }
    static string Ask(string prompt) { Console.Write(prompt + ": "); string value = Console.ReadLine(); if (value == null) throw new Exception("Operacao cancelada."); return value.Trim(); }
    static string AskPort(string prompt) { string value = Ask(prompt); int port; if (!Regex.IsMatch(value, @"^\d{1,5}$") || !int.TryParse(value, out port) || port < 1 || port > 65535) throw new Exception("Porta invalida."); return value; }
    static string Code() {
        Console.Write("Codigo de pareamento (6 digitos, oculto): "); var code = new StringBuilder();
        while (true) { var key = Console.ReadKey(true); if (key.Key == ConsoleKey.Enter) break; if (key.Key == ConsoleKey.Backspace && code.Length > 0) code.Length--; else if (char.IsDigit(key.KeyChar) && code.Length < 6) code.Append(key.KeyChar); }
        Console.WriteLine(); if (!Regex.IsMatch(code.ToString(), @"^[0-9]{6}$")) throw new Exception("Codigo invalido."); return code.ToString();
    }
    static string Run(string args, string input = null) {
        var start = new ProcessStartInfo(Adb, "-P 5041 " + args) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true, RedirectStandardInput = true };
        using (var process = Process.Start(start)) {
            var output = process.StandardOutput.ReadToEndAsync(); var error = process.StandardError.ReadToEndAsync();
            if (input != null) process.StandardInput.WriteLine(input); process.StandardInput.Close();
            if (!process.WaitForExit(40000)) { process.Kill(); throw new Exception("Tempo de conexao esgotado. Confira a TV e tente novamente."); }
            Task.WaitAll(output, error);
            if (process.ExitCode != 0) throw new Exception("ADB nao concluiu a operacao. Confira IP, portas, codigo e autorizacao na TV.");
            if (output.Result.Length > 600000) throw new Exception("Resposta da TV acima do limite.");
            return output.Result.Trim();
        }
    }
    static string Read(string serial, string command, List<string> warnings) {
        try { return Run("-s " + serial + " shell " + command); }
        catch { warnings.Add("Metrica indisponivel: " + command); return ""; }
    }
    static string Value(string value) { return string.IsNullOrWhiteSpace(value) ? "Nao informado" : value.Substring(0, Math.Min(value.Length, 160)); }
    static bool AllowedOrigin(string origin) { return origin == "https://www.kivai.com.br" || origin == "https://kivai.com.br"; }
    static bool TokenMatches(string a, string b) { if (a.Length != b.Length) return false; int result = 0; for (int i = 0; i < a.Length; i++) result |= a[i] ^ b[i]; return result == 0; }
    static string NewToken() { var bytes = new byte[32]; using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(bytes); return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant(); }
    static void Reply(NetworkStream stream, int code, string origin, string body) {
        var bytes = Encoding.UTF8.GetBytes(body);
        string cors = AllowedOrigin(origin) ? "Access-Control-Allow-Origin: " + origin + "\r\nVary: Origin\r\nAccess-Control-Allow-Methods: GET\r\nAccess-Control-Allow-Headers: Authorization\r\nAccess-Control-Allow-Private-Network: true\r\n" : "";
        string header = "HTTP/1.1 " + code + " " + (code == 200 ? "OK" : "Denied") + "\r\nContent-Type: application/json; charset=utf-8\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n" + cors + "Content-Length: " + bytes.Length + "\r\n\r\n";
        byte[] h = Encoding.ASCII.GetBytes(header); stream.Write(h, 0, h.Length); stream.Write(bytes, 0, bytes.Length);
    }
    static void ServeClient(TcpClient client, string token, string report) {
        using (client) {
            client.ReceiveTimeout = 2000; client.SendTimeout = 2000;
            using (var stream = client.GetStream()) {
                // Bounded HTTP headers. No request bodies, proxying, commands or arbitrary paths.
                var data = new List<byte>(); int next;
                var deadline = DateTime.UtcNow.AddSeconds(3);
                while (data.Count < 8192 && DateTime.UtcNow < deadline && (next = stream.ReadByte()) >= 0) {
                    data.Add((byte)next); int n = data.Count;
                    if (n >= 4 && data[n-4] == 13 && data[n-3] == 10 && data[n-2] == 13 && data[n-1] == 10) break;
                }
                string raw = Encoding.ASCII.GetString(data.ToArray());
                if (!raw.EndsWith("\r\n\r\n")) return;
                string[] lines = raw.Split(new[] { "\r\n" }, StringSplitOptions.None);
                var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                foreach (var line in lines.Skip(1).Where(l => l.Length > 0)) { int colon = line.IndexOf(':'); if (colon < 1) return; string key = line.Substring(0, colon); if (headers.ContainsKey(key)) return; headers[key] = line.Substring(colon + 1).Trim(); }
                string origin, host, auth;
                headers.TryGetValue("Origin", out origin); headers.TryGetValue("Host", out host); headers.TryGetValue("Authorization", out auth);
                if (!AllowedOrigin(origin) || host != "127.0.0.1:" + Port) { Reply(stream, 403, "", "{}"); return; }
                if (headers.ContainsKey("Transfer-Encoding") || headers.ContainsKey("Content-Length") && headers["Content-Length"] != "0") { Reply(stream, 400, origin, "{}"); return; }
                if (lines[0] == "OPTIONS /report HTTP/1.1") { Reply(stream, 200, origin, "{}"); return; }
                if (lines[0] != "GET /report HTTP/1.1" || !TokenMatches(auth ?? "", "Bearer " + token)) { Reply(stream, 401, origin, "{}"); return; }
                Reply(stream, 200, origin, report);
            }
        }
    }
    static void Serve(string token, string report) {
        var listener = new TcpListener(IPAddress.Loopback, Port);
        try {
            listener.Start(4); Console.WriteLine("Codigo de sessao (cole no site):\n" + token);
            Console.WriteLine("Relatorio disponivel apenas neste computador por 10 minutos. Feche esta janela para encerrar.");
            var end = DateTime.UtcNow.AddMinutes(10);
            while (DateTime.UtcNow < end) { if (!listener.Pending()) { System.Threading.Thread.Sleep(100); continue; } try { ServeClient(listener.AcceptTcpClient(), token, report); } catch (IOException) { } catch (SocketException) { } }
        } catch (SocketException) { Console.WriteLine("Conexao com o navegador indisponivel. Importe o arquivo kivai-tv.json no site."); }
        finally { listener.Stop(); }
    }
    static string TestHttp(string request) {
        var listener = new TcpListener(IPAddress.Loopback, 0); listener.Start();
        try {
            var task = Task.Run(() => ServeClient(listener.AcceptTcpClient(), "test-token", "{\"test\":true}"));
            using (var client = new TcpClient()) {
                client.Connect(IPAddress.Loopback, ((IPEndPoint)listener.LocalEndpoint).Port);
                byte[] bytes = Encoding.ASCII.GetBytes(request); client.GetStream().Write(bytes, 0, bytes.Length);
                var result = new StreamReader(client.GetStream()).ReadToEnd(); task.Wait(); return result;
            }
        } finally { listener.Stop(); }
    }
    static int Main(string[] args) {
        if (args.Length == 1 && args[0] == "--self-test") {
            if (!PrivateIp("192.168.1.5") || !PrivateIp("172.31.1.2") || PrivateIp("172.32.0.1") || PrivateIp("127.0.0.1") || PrivateIp("8.8.8.8") || PrivateIp("192.168.1.2;whoami") || AllowedOrigin("https://evil.example") || AllowedOrigin("https://www.kivai.com.br.evil.example") || !TokenMatches("abc", "abc") || TokenMatches("abc", "abd") || NewToken().Length != 64) return 1;
            string request = "GET /report HTTP/1.1\r\nHost: 127.0.0.1:47831\r\nOrigin: https://www.kivai.com.br\r\nAuthorization: Bearer test-token\r\n\r\n";
            if (!TestHttp(request).Contains("{\"test\":true}") || !TestHttp(request.Replace("test-token", "wrong-token")).StartsWith("HTTP/1.1 401") || !TestHttp(request.Replace("https://www.kivai.com.br", "https://evil.example")).StartsWith("HTTP/1.1 403") || !TestHttp(request.Replace("Host: 127.0.0.1:47831", "Host: evil.example")).StartsWith("HTTP/1.1 403") || !TestHttp(request.Replace("GET /report", "POST /report")).StartsWith("HTTP/1.1 401") || !TestHttp(request.Replace("GET /report", "GET /shell")).StartsWith("HTTP/1.1 401")) return 1;
            Console.WriteLine("Validation self-test passed. No ADB command executed."); return 0;
        }
        if (args.Length != 0) return 1;
        string serial = null;
        try {
            Console.WriteLine("KIVAI CONNECT 0.1 beta - Windows - diagnostico somente leitura\nNenhum aplicativo sera instalado, desativado ou removido da TV.");
            Adb = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "platform-tools", "adb.exe");
            if (!File.Exists(Adb)) throw new Exception("Extraia os Android Platform Tools oficiais na pasta platform-tools, ao lado deste aplicativo. Consulte o guia no site Kivai.");
            string ip = Ask("IP privado exibido na TV"); if (!PrivateIp(ip)) throw new Exception("Use o IPv4 privado exibido na TV, na mesma rede do computador.");
            string pairPort = AskPort("Porta da tela Parear por codigo"); string code = Code();
            string paired = Run("pair " + ip + ":" + pairPort, code); code = null;
            if (paired.IndexOf("Successfully paired", StringComparison.OrdinalIgnoreCase) < 0) throw new Exception("Pareamento nao confirmado pela TV.");
            string connectionPort = AskPort("Porta da tela principal de Depuracao sem fio (nao a porta de pareamento)"); serial = ip + ":" + connectionPort;
            string connected = Run("connect " + serial);
            if (connected.IndexOf("connected to", StringComparison.OrdinalIgnoreCase) < 0) throw new Exception("Conexao nao confirmada.");
            Console.WriteLine("A coleta le fabricante, modelo, versao, armazenamento, memoria e nomes dos pacotes instalados. O relatorio fica neste computador.");
            if (Ask("Digite COLETAR para autorizar") != "COLETAR") throw new Exception("Coleta cancelada.");
            var warnings = new List<string>();
            string sdkText = Read(serial, "getprop ro.build.version.sdk", warnings); int sdk;
            if (!int.TryParse(sdkText, out sdk) || sdk < 21 || sdk > 100) throw new Exception("Versao Android nao identificada.");
            var report = new Dictionary<string, object>();
            report["schemaVersion"] = 1; report["collectedAt"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
            report["manufacturer"] = Value(Read(serial, "getprop ro.product.manufacturer", warnings));
            report["model"] = Value(Read(serial, "getprop ro.product.model", warnings));
            report["androidVersion"] = Value(Read(serial, "getprop ro.build.version.release", warnings)); report["sdk"] = sdk;
            report["storageRaw"] = Read(serial, "df -k /data", warnings);
            report["memoryRaw"] = Read(serial, "cat /proc/meminfo", warnings);
            string packages = Read(serial, "pm list packages", warnings);
            report["apps"] = packages.Split('\n').Select(p => p.Trim()).Where(p => Regex.IsMatch(p, @"^package:[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$")).Select(p => p.Substring(8)).Distinct().Take(2000).ToArray();
            report["warnings"] = warnings;
            string json = Json.Serialize(report);
            string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KivaiConnect"); Directory.CreateDirectory(dir);
            string path = Path.Combine(dir, "kivai-tv.json"); File.WriteAllText(path, json, new UTF8Encoding(false));
            Console.WriteLine("Diagnostico salvo em: " + path);
            Run("disconnect " + serial); serial = null;
            Console.WriteLine("ADB desconectado. Desative a depuracao sem fio ao terminar e revogue o computador na TV se desejar.");
            Console.WriteLine("Abra https://www.kivai.com.br/ferramentas/kivai-connect");
            Serve(NewToken(), json); return 0;
        } catch (Exception ex) { Console.WriteLine(ex.Message); Console.WriteLine("Pressione Enter para fechar."); Console.ReadLine(); return 1; }
        finally { if (serial != null) try { Run("disconnect " + serial); } catch { } }
    }
}
