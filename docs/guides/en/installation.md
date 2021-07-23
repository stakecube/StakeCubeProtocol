# Installation

This guide describes how to install and configure **StakeCube Protocol (SCP)**.

Depending on the field of application and the implementation goals, SCP can be operated with a full-fledged StakeCubeCoin (SCC) node or as a *Lightwallet*. Here we describe both options.

The full implementation is recommended for situations when full SCP transactions are necessary, like for example withdrawals and deposits of SCC or SCP tokens. 

With the lightwallet option, SCP automatically connects to an SCC node operated by StakeCube.net. With this variant, it is not necessary to synchronize the entire blockchain, but it does not offer full flexibility or security.

The lightwallet option is also the fallback mechanism if the local SCC node cannot be reached.

## Requirements

A Linux distribution is recommended for the SCC and SCP installation. Full root access is required.

Hardware recommendation for full implementation (including SCC):

- 2 CPU Cores
- 8 GB RAM
- 200 GB SSD
 
Hardware recommendation for SCP (without SCC):

- 1 CPU Core
- 2 GB RAM
- 25 GB SSD

> For this guide we used the following system environment: 
> - Operating system: Ubuntu 20.04 LTS
> - The installation takes place in the /home/ directory of the server.
> - Editor: nano (sudo apt install nano)
> - Git to download SCP (sudo apt install git)
> - Unzip to unzip archives (sudo apt install unzip)

## Installation Guide
Updating the operating system:

```bash
sudo apt update
sudo apt upgrade
```

### StakeCubeCoin

The following steps describe how to download and start SCC.

Download the SCC daemon for Linux:

```bash
cd /home/
mkdir scc
cd scc
wget https://github.com/stakecube/StakeCubeCoin/releases/download/v3.1.0/scc-3.1.0-linux-daemon.zip
unzip scc-3.1.0-linux-daemon.zip
```

> It is recommended to use the latest version. You can find the code and all downloads here: https://github.com/stakecube/StakeCubeCoin.
>
> Alternatively, you can also compile SCC on your own. The corresponding instructions can be found in the /doc directory.

Now create a configuration file for the SCC node as follows:

```bash
mkdir .stakecubecoin
nano .stakecubecoin/stakecubecoin.conf
```

Content of the configuration file:
```bash
rpcuser=username
rpcpassword=password
server=1
listen=1
txindex=1
addressindex=1
```

> Please assign a unique username and a secure password.

Now set up a service for SCC in order to keep the daemon intact after expected or unexpected restarts of the server:

```bash
cd /usr/local/bin
echo '#!/bin/bash' >> scc
echo '/home/scc/scc-cli -conf=/home/scc/.stakecubecoin/stakecubecoin.conf -datadir=/home/scc/.stakecubecoin $@' >> scc
chmod +x scc
cd /etc/systemd/system
nano scc.service
```

Content of the *scc.service* file
```bash
[Unit]
Description=scc service
After=network.target

[Service]
User=root
Group=root

Type=forking
ExecStart=/home/scc/sccd -daemon -conf=/home/scc/.stakecubecoin/stakecubecoin.conf -datadir=/home/scc/.stakecubecoin
ExecStop=/home/scc/scc-cli -conf=/home/scc/.stakecubecoin/stakecubecoin.conf -datadir=/home/scc/.stakecubecoin stop

Restart=always
PrivateTmp=true
TimeoutStopSec=60s
TimeoutStartSec=10s
StartLimitInterval=120s
StartLimitBurst=5

[Install]
WantedBy=multi-user.target
```

Start the service and with it also the SCC daemon:

```bash
systemctl enable scc
systemctl start scc
```

Now the program will download the blockchain data in the background. This can take a few hours. 

Use the following CLI commands to control the number of network connections, the current block height and the block hash:

```bash
scc getconnectioncount
scc getblockcount
scc getblockhash <block>  // scc getblockhash 181818
```

Use a blockchain explorer such as https://scc.ccore.online to compare your node with the StakeCubeCoin network.

With this, the installation of SCC is complete.

You can find possible bug fixes at the end of this document.

### StakeCube Protocol

The following steps describe how to download and start SCP.

Install NodeJS (version 16.x + NPM) and pm2:

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install nodejs
npm i pm2 -g
```

Download SCP using Git:

```bash
cd /home
git clone https://github.com/stakecube/StakeCubeProtocol.git scp
```

You can also download the files and put them on your server manually, but Git makes future updates and maintenance easier.

Next, navigate to the StakeCubeProtocol folder and initialize the required dependencies:

```bash
cd scp/
npm i
```

*Optional*:
Create the SCP configuration file if you use the SCC daemon (full integration):

```bash    
cd ~
mkdir .config .config/SCPWallet
cd .config/SCPWallet/
nano scp.conf
```

Content of the *scp.conf* file
```bash  
coredatadir=/home/scc/.stakecubecoin/
coreconfname=stakecubecoin.conf
```

Start SCP with pm2:

```bash    
cd /home/scp/
pm2 start src/index.js
```

To keep your process intact in the event of expected or unexpected server restarts, save the process: 

```bash    
pm2 save
```

Call the log file:

```bash
pm2 logs 0
```

A successful installation and connection to your SCC Core wallet will show a message like this one:

    Init: Finished - Running as Fullnode! (Syncing)


SCP is now installed, set up as a process and ready to use via the interface.

### Make access more secure

**Set up firewall:**

Install and configure a firewall so that only your (web) server has access to the relevant APIs:

```bash
sudo apt install ufw
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 40000 comment "SCC p2p"
sudo ufw allow from 1.1.1.1 to any port 39999 comment "SCC RPC"
sudo ufw allow from 1.1.1.1 to any port 3000 comment "SCP"
sudo ufw enable
```

Replace 1.1.1.1 with your IP.

### Troubleshooting

*Problem:*

SCC Node cannot find any connections to the network, does not synchronize or crashes.

*Possible solutions:*

1. Bootstrap SCC

Make sure that the SCC daemon is stopped.

```bash
cd /home/scc/.stakecubecoin/
rm -r -f database evodb blocks chainstate llmq
wget https://github.com/stakecube/StakeCubeProtocol/releases/latest/download/indexed-bootstrap.zip
unzip -o indexed-bootstrap.zip
```
