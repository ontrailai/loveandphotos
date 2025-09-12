#!/bin/bash

echo "==================================================="
echo "Docker Engine Installation Script for WSL"
echo "==================================================="
echo ""
echo "This script will install Docker Engine directly in WSL."
echo "You will need to enter your sudo password when prompted."
echo ""
echo "Steps this script will perform:"
echo "1. Update package lists"
echo "2. Install prerequisites"
echo "3. Add Docker's official GPG key"
echo "4. Set up the Docker repository"
echo "5. Install Docker Engine"
echo "6. Add your user to the docker group"
echo "7. Start Docker service"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Update package lists
echo "Step 1: Updating package lists..."
sudo apt-get update

# Install prerequisites
echo "Step 2: Installing prerequisites..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
echo "Step 3: Adding Docker's GPG key..."
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo "Step 4: Setting up Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package lists again
echo "Step 5: Updating package lists with Docker repository..."
sudo apt-get update

# Install Docker Engine
echo "Step 6: Installing Docker Engine, CLI, and plugins..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
echo "Step 7: Adding $USER to docker group..."
sudo usermod -aG docker $USER

# Start Docker service
echo "Step 8: Starting Docker service..."
sudo service docker start

# Test Docker installation
echo "Step 9: Testing Docker installation..."
sudo docker run hello-world

echo ""
echo "==================================================="
echo "Docker Installation Complete!"
echo "==================================================="
echo ""
echo "IMPORTANT: You need to log out and back in for group changes to take effect."
echo "Or run: newgrp docker"
echo ""
echo "To start Docker automatically on WSL startup, add this to your ~/.bashrc:"
echo "  # Start Docker daemon automatically when logging in if not running."
echo "  RUNNING=\$(ps aux | grep '[d]ocker' | wc -l)"
echo "  if [ \"\${RUNNING}\" -eq \"0\" ]; then"
echo "      sudo service docker start"
echo "  fi"
echo ""
echo "To verify Docker is working without sudo, run:"
echo "  docker run hello-world"