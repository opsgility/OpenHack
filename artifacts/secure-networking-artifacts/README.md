# Secure Networking OpenHack Artifacts

You can find in this repository assets required for the Secure Networking [OpenHack](https://openhack.microsoft.com) to deploy the application required (you can find the source code for the application [here](https://github.com/Microsoft/YADA)).

## OpenHack Network Diagnostics (OHND) application

The Secure Networking OpenHack uses the OpenHack Network Diagnostics (OHND) as application throughout all of the exercises. The application's tier components can be deployed via ARM templates to Azure virtual machines.

For the application tier, the template needs the following parameters:

- VNet and subnet name
- SQL FQDN and credentials
- Optionally an Availability Zone

Here an example of how to deploy the application tier to an Azure Virtual machine:

```bash
# Bash script

# Variables
rg='your_resource_group'
location='your_azure_region'

vnet_name='your_vnet_name'
api_subnet_name='your_app_subnet'
vm_username='demouser'
vm_password='your_vm_password'
sql_server_fqdn='fully_qualified_domain_name_of_a_SQL_server'
sql_username='your_sql_server_username'
sql_password='your_sql_server_password'
api_template_uri='https://raw.githubusercontent.com/Microsoft-OpenHack/secure-networking-artifacts/main/deploy_api_to_vm.json'

# Create VM for API tier
echo "Creating API VM..."
az deployment group create -n appvm -g $rg --template-uri $api_template_uri \
    --parameters vmName=api \
                 adminUsername=$vm_username \
                 adminPassword=$vm_password \
                 virtualNetworkName=$vnet_name \
                 sqlServerFQDN=$sql_server_fqdn \
                 sqlServerUser=$sql_username \
                 "sqlServerPassword=$sql_password" \
                 subnetName=$api_subnet_name \
                 availabilityZone=1
```

Similarly, for the web tier you will need to provide the following parameters:

- VNet and subnet name
- URL to access the API
- Optionally an Availability Zone

Here an example of how to deploy the web tier to an Azure Virtual Machine:

```bash
# Variables
rg='your_resource_group'
location='your_azure_region'
vnet_name='your_vnet_name'
web_subnet_name='your_web_subnet'
vm_username='demouser'
vm_password='your_vm_password'
api_ip_address='1.2.3.4'
web_template_uri='https://raw.githubusercontent.com/Microsoft-OpenHack/secure-networking-artifacts/main/deploy_web_to_vm.json'

# Create VM for web tier
echo "Creating web VM..."
az deployment group create -n webvm -g $rg --template-uri $web_template_uri \
    --parameters vmName=web \
                 adminUsername=$vm_username \
                 adminPassword=$vm_password \
                 virtualNetworkName=$vnet_name \
                 "apiUrl=http://${api_ip_address}:8080" \
                 subnetName=$web_subnet_name \
                 availabilityZone=1
```

## Testing

After deploying both the API and web VMs, you can access the application:

- The full application is available on the IP address of the web VM (TCP port 80)
- You can individually access the API on the IP address of the API VM (TCP port 8080)
- The web VM is deployed with an SNMP daemon, you can access it on UDP port 161. For example, from Linux:
  - `snmpget -v2c -c public <ip_address_of_web_vm> 1.3.6.1.2.1.1.1.0`

## Troubleshooting

- Make sure that the VM has Internet connectivity, otherwise it will not be able to download the container images.
- You can SSH into the deployed VM and check that the container apps are running, with the command `sudo docker ps`. You should have at least a container named `web` running, and possibly another one called `snmp` (only if you set the ARM parameter `deploySNMPContainer` to `no` you wouldn't have it).
- The default settings deploy a VM from the marketplace, that you need to accept first. If you don't have enough permissions to accept Marketplace offers, you can try the `ubuntu` VM (with the ARM parameter `vmType`, see below).
- If a given VM type such as `flatcar` has issues, try a different OS such as `ubuntu`.
- If the application doesn't get correctly deployed, you can log into the Virtual Machine (via SSH, Azure Bastion or Azure Serial Console), and investigate the cloudinit logs of the Virtual Machine. You can usually find cloudinit logs for Ubuntu VMs in the `/var/log/cloud-init-output.log` file.

## Other options

The ARM template supports some additional parameters for deployment:

- `vmType`: can be either `kinvolk` (default) or `ubuntu`. It is the OS of the VM where the application will be deployed. It can be verified via SNMP.
- `backgroundColor` (web only): background color for the web app, defaults to `#d3d3d3`.
- `headerName`, `headerValue` (web only): If specified, the app will make sure that this HTTP header (name and value) is present in the request.
- `deploySNMPContainer` (web only): can be either `yes` (default) or `no`. Whether an SNMP container will be deployed along the web application.
