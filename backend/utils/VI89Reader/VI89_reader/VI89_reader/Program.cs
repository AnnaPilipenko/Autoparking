using System;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Threading.Tasks;

namespace VI89_reader
{
    class Program
    {
        static void Main(string[] args)
        {
            if(args.Length != 4)
            {
                Console.WriteLine("Run: {ProgramName}.exe {ReaderIP} {ReaderPort} {HostIP} {HostPort}");
                return;
            }

            Reader reader = new Reader(args[0], Convert.ToUInt32(args[1]), args[2], Convert.ToUInt32(args[3]));

            reader.SetAntennaSelection(1);
            reader.Connect();

            if(!reader.IsConnected())
            {
                return;
            }
            else
            {
                Console.WriteLine("Connected");
            }

            while (true)
            {
                var list = reader.Read();

                if(list.Count > 0)
                {
                    Console.Write("Data ");
                    string str = string.Empty;

                    for(int i=0; i<list.Count; i++)
                    {
                        str += ";" + list[i];
                    }

                    Console.WriteLine(str.Substring(1));
                }

                Task.Delay(10);
            }
        }
    }
}
