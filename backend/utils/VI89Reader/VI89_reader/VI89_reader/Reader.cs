using System;
using System.Collections.Generic;

namespace VI89_reader
{
    class Reader
    {
        public API reader = new API();

        public enum Error
        {
            NoReaderConnected,
            CannotConnect,
            NoAntennaSelected,
            FailToSetAntenna,
            CannotGetBasicParams
        };

        private int TryRequestCount = 3;

        private bool[] antenna = { false, false, false, false };

        private bool isConnected = false;

        private string readerIP = string.Empty;
        private uint readerPort = 0;
        private string hostIP = string.Empty;
        private uint hostPort = 0;

        int m_hSocket = -1;

        private void AssertError(Error error)
        {
            Console.WriteLine("Error " + error.ToString());
        }

        public Reader(string readerIP, uint readerPort, string hostIP, uint hostPort)
        {
            this.readerIP = readerIP;
            this.readerPort = readerPort;
            this.hostIP = hostIP;
            this.hostPort = hostPort;
        }

        public bool IsConnected()
        {
            return isConnected;
        }

        public bool SetAntennaSelection(int antennaNumber, bool selected = true)
        {
            if(antennaNumber > 0 && antennaNumber <= 4)
            {
                antenna[antennaNumber - 1] = selected;
            }

            return false;
        }

        public List<string> Read()
        {
            var list = new List<string>();

            byte[,] TagBuffer = new byte[100, 130];
            int res;

            for(int z = 0; z < 4; z++)
            {
                int tagsCount = 0, ID_len = 0, ID_len_temp = 0, activeAntenna = 0;
                string str, strtemp;
                byte[] DB = new byte[128];
                byte[] IDBuffer = new byte[7680];

                switch (z)
                {
                    case 0:
                        if (antenna[0])
                        {
                            activeAntenna = 1;
                            res = API.Net_SetAntenna(m_hSocket, activeAntenna);
                        }
                        break;
                    case 1:
                        if (antenna[1])
                        {
                            activeAntenna = 2;
                            res = API.Net_SetAntenna(m_hSocket, activeAntenna);
                        }
                        break;
                    case 2:
                        if (antenna[2])
                        {
                            activeAntenna = 4;
                            res = API.Net_SetAntenna(m_hSocket, activeAntenna);
                        }
                        break;
                    case 3:
                        if (antenna[3])
                        {
                            activeAntenna = 8;
                            res = API.Net_SetAntenna(m_hSocket, activeAntenna);
                        }
                        break;
                }

                if (activeAntenna != 0)
                {
                    Array.Clear(TagBuffer, 0, TagBuffer.Length);

                    res = API.Net_EPC1G2_ReadLabelID(m_hSocket, 1, 0, 0, new byte[96], IDBuffer, ref tagsCount);

                    if (res == 0)
                    {
                        for (int i = 0; i < tagsCount; i++)
                        {
                            if (IDBuffer[ID_len] > 32)
                            {
                                tagsCount = 0;
                                break;
                            }

                            ID_len_temp = IDBuffer[ID_len] * 2 + 1;

                            for (int j = 0; j < ID_len_temp; j++)
                            {
                                TagBuffer[i, j] = IDBuffer[ID_len + j];
                            }


                            ID_len += ID_len_temp;
                        }

                        for (int i = 0; i < tagsCount; i++)
                        {
                            str = "";
                            strtemp = "";
                            ID_len = TagBuffer[i, 0] * 2;

                            for (int j = 0; j < ID_len; j++)
                            {
                                strtemp = TagBuffer[i, j + 1].ToString("X2");
                                str += strtemp;
                            }

                            if(str.Length > 0)
                            {
                                list.Add(str);
                            }
                        }
                    }
                }
            }
            
            return list;
        }

        public bool Connect()
        {
            if(isConnected)
            {
                return true;
            }

            int res = 0;

            // Connect scanner
            
            for (int i = 0; i < TryRequestCount; i++)
            {
                res = API.Net_ConnectScanner(ref m_hSocket, readerIP, readerPort, hostIP, hostPort);

                if (res == 0)
                {
                    break;
                }
            }

            if (res != 0)
            {
                AssertError(Error.NoReaderConnected);

                return false;
            }


            // Try to get basic params

            var basicParam = new API.ReaderBasicParam();

            for (int i = 0; i < TryRequestCount; i++)
            {
                res = API.Net_ReadBasicParam(m_hSocket, ref basicParam);

                if (res == 0)
                {
                    break;
                }
            }

            if (res != 0)
            {
                AssertError(Error.CannotGetBasicParams);

                return false;
            }


            // Try to connect

            for (int i = 0; i < TryRequestCount; i++)
            {
                res = API.Net_AutoMode(m_hSocket, 0);

                if (res == 0)
                {
                    break;
                }
            }

            if (res != 0)
            {
                AssertError(Error.CannotConnect);

                return false;
            }


            // Set active antenna

            int selectedAntenna = 0;

            if (antenna[0])
            {
                selectedAntenna += 1;
            }

            if (antenna[1])
            {
                selectedAntenna += 2;
            }

            if (antenna[2])
            {
                selectedAntenna += 4;
            }

            if (antenna[3])
            {
                selectedAntenna += 8;
            }

            if (selectedAntenna == 0)
            {
                AssertError(Error.NoAntennaSelected);

                return false;
            }

            for (int i = 0; i < TryRequestCount; i++)
            {
                res = API.Net_SetAntenna(m_hSocket, selectedAntenna);

                if (res == 0)
                {
                    break;
                }
            }

            if (res != 0)
            {
                AssertError(Error.FailToSetAntenna);

                return false;
            }

            isConnected = true;

            return isConnected;
        }

        public bool Disconnect()
        {
            if (isConnected == false)
            {
                return true;
            }

            int res = API.Net_DisconnectScanner(m_hSocket);

            return res == 0;
        }
    }
}
