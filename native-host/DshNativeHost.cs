using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading;

/// <summary>
/// Native messaging shim: Chromium can only launch an executable, so this stub
/// relays the browser's stdio to the Node implementation (host.mjs) next to it.
/// stdout carries the native-messaging frames; stderr goes to a log file.
/// </summary>
internal static class Program
{
    private static string BaseDir()
    {
        var location = Assembly.GetExecutingAssembly().Location;
        return string.IsNullOrEmpty(location)
            ? AppDomain.CurrentDomain.BaseDirectory
            : Path.GetDirectoryName(location);
    }

    private static int Main()
    {
        var dir = BaseDir();
        var script = Path.Combine(dir, "host.mjs");
        var log = Path.Combine(dir, "host.log");

        var nodeExe = "node.exe";
        var explicitNode = @"D:\nodejs\node.exe";
        if (File.Exists(explicitNode)) nodeExe = explicitNode;

        var psi = new ProcessStartInfo
        {
            FileName = nodeExe,
            Arguments = "\"" + script + "\"",
            WorkingDirectory = dir,
            UseShellExecute = false,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        Process child;
        try
        {
            child = Process.Start(psi);
        }
        catch (Exception error)
        {
            File.AppendAllText(log, DateTime.Now.ToString("s") + " spawn failed: " + error + Environment.NewLine);
            return 1;
        }

        var pumpIn = new Thread(() =>
        {
            try
            {
                var stdin = Console.OpenStandardInput();
                var toChild = child.StandardInput.BaseStream;
                var buffer = new byte[8192];
                int read;
                // Flush after every chunk: a buffered FileStream would hold a
                // small native-messaging frame until the pipe closes, which
                // looks like a hung host to the browser.
                while ((read = stdin.Read(buffer, 0, buffer.Length)) > 0)
                {
                    toChild.Write(buffer, 0, read);
                    toChild.Flush();
                }
            }
            catch (Exception error) { File.AppendAllText(log, DateTime.Now.ToString("s") + " stdin: " + error.Message + Environment.NewLine); }
            finally { try { child.StandardInput.Close(); } catch { } }
        });
        pumpIn.IsBackground = true;
        pumpIn.Start();

        var pumpErr = new Thread(() =>
        {
            try
            {
                string line;
                while ((line = child.StandardError.ReadLine()) != null)
                    File.AppendAllText(log, DateTime.Now.ToString("s") + " " + line + Environment.NewLine);
            }
            catch { }
        });
        pumpErr.IsBackground = true;
        pumpErr.Start();

        try
        {
            var stdout = Console.OpenStandardOutput();
            var fromChild = child.StandardOutput.BaseStream;
            var outBuffer = new byte[8192];
            int readOut;
            while ((readOut = fromChild.Read(outBuffer, 0, outBuffer.Length)) > 0)
            {
                stdout.Write(outBuffer, 0, readOut);
                stdout.Flush();
            }
            stdout.Flush();
        }
        catch (Exception error)
        {
            File.AppendAllText(log, DateTime.Now.ToString("s") + " stdout: " + error.Message + Environment.NewLine);
        }

        child.WaitForExit();
        return 0;
    }
}
