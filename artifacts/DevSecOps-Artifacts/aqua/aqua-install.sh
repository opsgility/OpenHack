#!/bin/bash

echo "step start: globals"

VMADMIN=$1
DOCKER_ID=$2
DOCKER_PASS=$3
AQUA_VERSION=$4
AQUA_LICENSE_TOKEN=$5
AQUA_ADMIN_PASSWORD=$6
AQUA_DB_PASSWORD=$7
AQUA_REPO="registry.aquasec.com"
DOCKER_REGISTRY="registry.aquasec.com"

echo "step end: globals"

echo "VMADMIN: $VMADMIN"
echo "AQUA_VERSION: $AQUA_VERSION"

echo "step start: install docker-ce"
sudo apt-get update
sudo apt-get install -y \
    apt-transport-https \
    gnupg-agent \
    ca-certificates \
    curl \
    software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce jq docker-ce-cli containerd.io
sudo groupadd docker
sudo usermod -aG docker $VMADMIN
sudo systemctl start docker
sudo systemctl enable docker
sleep 10
docker version
lExitCode=$?
if [ $lExitCode == "0" ];then
  echo "Docker installed successfully"
else
  echo "Failed to install docker, exit code : $lExitCode, exiting"
  exit 1
fi
echo "step end: install docker-ce"

#Docker login
echo $DOCKER_PASS | docker login -u $DOCKER_ID --password-stdin $DOCKER_REGISTRY
lExitCode=$?
if [ $lExitCode == "0" ];then
  echo "Sucessfully logged in to DOCKER_REGISTRY"
else
  echo "Failed to login to DOCKER_REGISTRY, exit code : $lExitCode , exiting"
  exit 1
fi
mkdir -p /opt/aquasec/data

#Start postgresDB
echo "step start: start postgresql container"
docker run -d -p 5432:5432 --name aqua-db \
   -e POSTGRES_PASSWORD=${AQUA_DB_PASSWORD} \
   -v /opt/aquasec/data:/var/lib/postgresql/data \
   --restart=unless-stopped \
$AQUA_REPO/database:$AQUA_VERSION
lExitCode=$?
if [ $lExitCode == "0" ];then
  echo "Sucessfully ran $AQUA_REPO/database:$AQUA_VERSION"
else
  echo "Failed to run $AQUA_REPO/database:$AQUA_VERSION, exit code : $lExitCode , exiting"
  exit 1
fi
echo "step end: start postgresql container"

#Start Aqua Server
echo "step start: start Aqua server container"
docker run -d -p 8080:8080 -p 443:8443 \
   --name aqua-web --user=root \
   -e SCALOCK_DBUSER=postgres \
   -e SCALOCK_DBPASSWORD=${AQUA_DB_PASSWORD} \
   -e SCALOCK_DBNAME=scalock \
   -e SCALOCK_DBHOST=$(hostname -i) \
   -e SCALOCK_AUDIT_DBUSER=postgres \
   -e SCALOCK_AUDIT_DBPASSWORD=${AQUA_DB_PASSWORD} \
   -e SCALOCK_AUDIT_DBNAME=slk_audit \
   -e SCALOCK_AUDIT_DBHOST=$(hostname -i) \
   -e LICENSE_TOKEN=${AQUA_LICENSE_TOKEN} \
   -e ADMIN_PASSWORD=${AQUA_ADMIN_PASSWORD} \
   -v /var/run/docker.sock:/var/run/docker.sock \
$AQUA_REPO/server:$AQUA_VERSION
lExitCode=$?
if [ $lExitCode == "0" ];then
  echo "Sucessfully ran $AQUA_REPO/server:$AQUA_VERSION"
else
  echo "Failed to run $AQUA_REPO/server:$AQUA_VERSION, exit code : $lExitCode , exiting"
  exit 1
fi
echo "step end: start Aqua server container"

#Start Aqua Gateway
echo "step start: start Aqua gateway container"
docker run -d -p 3622:3622 --net=host --name aqua-gateway \
    -e SCALOCK_DBUSER=postgres \
    -e SCALOCK_DBPASSWORD=${AQUA_DB_PASSWORD} \
    -e SCALOCK_DBNAME=scalock \
    -e SCALOCK_DBHOST=$(hostname -i) \
    -e SCALOCK_AUDIT_DBUSER=postgres \
    -e SCALOCK_AUDIT_DBPASSWORD=${AQUA_DB_PASSWORD} \
    -e SCALOCK_AUDIT_DBNAME=slk_audit \
    -e AQUA_CONSOLE_SECURE_ADDRESS=$(hostname -i):443 \
    -e SCALOCK_AUDIT_DBHOST=$(hostname -i) \
$AQUA_REPO/gateway:$AQUA_VERSION
lExitCode=$?
if [ $lExitCode == "0" ];then
  echo "Sucessfully ran $AQUA_REPO/gateway:$AQUA_VERSION"
else
  echo "Failed to run $AQUA_REPO/gateway:$AQUA_VERSION, exit code : $lExitCode , exiting"
  exit 1
fi
echo "step start: start Aqua gateway container"


echo "step start: validate Aqua license status"
for (( i=1; i<5; ++i)); do
    echo "validation attempt $i/5"
    lLicenseStatus=$(curl -s http://$(hostname -i):8080/api | jq -r '.license_status')
    [ $lLicenseStatus == "valid" ] && break
    echo "retry validation $i/5 in 30 seconds"
    sleep 30
done


if [ $lLicenseStatus == "valid" ];then
  echo "Aqua license status status: $lLicenseStatus"
  exit 0
else
  "Aqua license status status: $lLicenseStatus , exiting with error"
  exit 1
fi