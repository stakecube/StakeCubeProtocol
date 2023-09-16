# Installation

Diese Anleitung beschreibt, wie **StakeCube Protocol (SCP)** Installiert und konfiguriert wird.

Je nach Verwendungsgebiet und Ziel der Implementierung kann SCP mit einer vollwertigen StakeCubeCoin (SCC) Node oder als _Lightwallet_ Betrieben werden. Beide Optionen werden nachfolgend beschrieben.

Die vollständige Implementierung ist empfohlen, wenn SCP Transaktionen durchgeführt werden müssen; wie die Ein-und Auszahlungen von SCC und Tokens.

Als Lightwallet, verbindet sich SCP automatisch mit einer von StakeCube.net betriebenen SCC Node. Mit dieser Variante ist eine Synchronisierung der gesamten Blockchain nicht notwendig, bietet jedoch nicht die volle Flexibilität oder Sicherheit.

Die Lightwallet Option ist gleichzeitig der Fallback-Mechanismus, wenn die lokale SCC Node nicht erreichbar ist.

## Voraussetzung

Für die Installation von SCC und SCP ist eine Linux-Distribution empfohlen. Voller Root-Zugriff ist Voraussetzung.

Hardware Empfehlung für vollständige Implementierung (inkl. SCC):

- 2 CPU Kerne
- 8 GB RAM
- 200 GB SSD

Hardware Empfehlung für SCP (ohne SCC):

- 1 CPU Kern
- 2 GB RAM
- 25 GB SSD

> Für diese Anleitung wird folgende Systemumgebung genutzt:
>
> - Betriebssystem: Ubuntu 20.04 LTS
> - Die Installation wird im /home/ Verzeichnis des Server durchgeführt.
> - Editor: nano ( sudo apt install nano )
> - Git für SCP Download ( sudo apt install git )
> - Unzip um Archive zu entpacken ( sudo apt install unzip )

## Installationsanleitung

Bringen Sie das Betriebssystem auf den aktuellsten Stand:

```bash
sudo apt update
sudo apt upgrade
```

### StakeCubeCoin

Die folgenden Schritte beschreiben, wie Sie SCC herunterladen und starten.

Laden Sie den SCC Daemon für Linux herunter:

```bash
cd /home/
mkdir scc
cd scc
wget https://github.com/stakecube/StakeCubeCoin/releases/download/v3.1.0/scc-3.1.0-linux-daemon.zip
unzip scc-3.1.0-linux-daemon.zip
```

> Es ist empfohlen, die neuste Version zu verwenden. Sie finden den Code und alle Downloads hier: https://github.com/stakecube/StakeCubeCoin.  
> Optional können Sie SCC auch eigenständig kompilieren. Entsprechende Anleitungen finden Sie im /doc Verzeichnis.

Erstellen Sie nun eine Konfigurations-Datei für die SCC Node wie folgt:

```bash
mkdir .stakecubecoin
nano .stakecubecoin/stakecubecoin.conf
```

Inhalt der Konfigurationsdatei:

```bash
rpcuser=username
rpcpassword=passwort
server=1
listen=1
txindex=1
addressindex=1
```

> Bitte vergeben Sie einen einzigartigen Usernamen und ein sicheres Passwort.

Richten Sie nun einen Service für SCC ein, um den Daemon über erwartete oder unerwartete Neustarts des Servers hinweg intakt zu halten:

```bash
cd /usr/local/bin
echo '#!/bin/bash' >> scc
echo '/home/scc/scc-cli -conf=/home/scc/.stakecubecoin/stakecubecoin.conf -datadir=/home/scc/.stakecubecoin $@' >> scc
chmod +x scc
cd /etc/systemd/system
nano scc.service
```

Inhalt der _scc.service_ Datei

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

Starten Sie den Service (und damit den SCC Daemon):

```bash
systemctl enable scc
systemctl start scc
```

Nun wird das Programm die Blockchain-Daten im Hintergrund herunterladen. Dies kann einige Stunden in Anspruch nehmen.

Kontrollieren Sie mit folgenden CLI Befehlen die Anzahl der Verbindungen zum Netzwerk, die aktuelle Blockhöhe und den Blockhash:

```bash
scc getconnectioncount
scc getblockcount
scc getblockhash <block>  // scc getblockhash 181818
```

Nutzen Sie einen Blockchain-Explorer wie https://www.coinexplorer.net/SCC, um Ihre Node mit dem StakeCubeCoin Netzwerk zu vergleichen.

Damit ist die Installation für SCC abgeschlossen.

Sie finden mögliche Fehlerbehebungen am Ende dieses Dokuments.

### StakeCube Protcol

Die folgenden Schritte beschreiben, wie Sie SCP herunterladen und starten.

Installieren Sie NodeJS (Version 16.x + NPM) und pm2:

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install nodejs
npm i pm2 -g
```

Laden Sie SCP mit Git herunter:

```bash
cd /home
git clone https://github.com/stakecube/StakeCubeProtocol.git scp
```

Sie können die Dateien auch manuell herunterladen und auf Ihren Server ablegen, jedoch macht Git zukünftige Updates und Wartung einfacher.

Navigieren Sie als Nächstes in den StakeCubeProtocol-Ordner und initialisieren Sie benötigten Abhängigkeiten:

```bash
cd scp/
npm i
```

_Optional_:  
Erstellen Sie die SCP Konfigurations-Datei, wenn Sie den SCC Daemon (vollständige Integration) nutzen:

```bash
cd ~
mkdir .config .config/SCPWallet
cd .config/SCPWallet/
nano scp.conf
```

Inhalt der _scp.conf_

```bash
coredatadir=/home/scc/.stakecubecoin/
coreconfname=stakecubecoin.conf
```

Starten Sie SCP mit pm2:

```bash
cd /home/scp/
pm2 start src/index.js
```

Speichern Sie den Prozess, um Ihre Prozessliste über erwartete oder unerwartete Neustarts des Servers hinweg intakt zu halten:

```bash
pm2 save
```

Rufen Sie die Log-Datei auf:

```bash
pm2 logs 0
```

Eine erfolgreiche Installation und Verbindung zur Ihrer SCC Core wallet zeigt ähnliche Meldung:

    Init: Finished - Running as Fullnode! (Syncing)

Damit ist SCP installiert, als Prozess eingerichtet und bereit zur Nutzung per Schnittstelle.

### Zugriff sicherer machen

**Firewall einrichten:**

Installieren und konfigurieren Sie eine Firewall, sodass nur Ihr (Web-)Server Zugriff auf entsprechende APIs hat:

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

Ersetzen Sie 1.1.1.1 durch Ihre IP.

### Fehlersuche und -behebung

_Problem:_

SCC Node findet keine Verbindungen zum Netzwerk, synchronisiert nicht oder stürzt ab.

_Mögliche Lösungen:_

1. Bootstrap SCC

Stellen Sie sicher, dass der SCC Daemon beendet ist.

```bash
cd /home/scc/.stakecubecoin/
rm -r -f database evodb blocks chainstate llmq
wget https://github.com/stakecube/StakeCubeProtocol/releases/latest/download/indexed-bootstrap.zip
unzip -o indexed-bootstrap.zip
```
