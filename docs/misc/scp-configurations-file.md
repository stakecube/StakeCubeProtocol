# SCP Configuration File

The configuration file is a list of setting=value pairs, one per line, with optional comments starting with the '#' character.

The configuration file is automatically created in the users home directory of the operating system at the first startup (if it does not already exist).

## Available Settings

| Name | Default | Description | Example |
|---------|---------|---------|---------|
| coredatadir | OS user directory | Data directory location of the SCC Core Node | /home/scc/ |
| coreconfname | stakecubecoin.conf | Name of the SCC Core Node configuration file | scc.conf |
| apimodules | none | Comma-seperated list of exposed REST API modules | `activity`, `blockchain`, `tokens`, `wallet`, `io` |
| apiport | 3000 | The port the REST API listens | 3001 |