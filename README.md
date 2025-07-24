### Guide to Run the IPFS Web App

This guide will help you set up and run the IPFS web application locally.

#### Setup Instructions

1.  **Clone or Download the Project**
    Place all project files in a folder, for example: `ipfs-web-app`.

2.  **Install Dependencies**
    Open your terminal or command prompt, navigate to the project directory, and run:
    ```bash
    npm install
    ```

3.  **Ensure IPFS Daemon is Running**
    In a separate terminal window/tab, start the IPFS daemon:
    ```REFER TO THE IPFS_SWARM_CLI GUIDE TO MAKESURE IT IS RUNNING
    ```
    Run the following commands at home directory to allow the API control over the port 5001

    ```ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'```

    ```ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]' ```
    Make sure it's fully initialized and listening on the default API port (`5001`).

5.  **Run the Application**
    In your project directory terminal, start the server with:
    ```bash
    node app.js
    ```

6.  **Access the Application**
    Open your browser and go to:
    ```
    http://localhost:3000
    ```
