# Use an official Node.js image as the base image
FROM node:16

# Install Python and dependencies
RUN apt-get update && apt-get install -y python3 python3-pip

# Set the working directory for the Node.js app
WORKDIR /app

# Copy package.json and install Node.js dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the Python requirements file and install Python dependencies
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port your app will run on
EXPOSE 3000

# Command to start the app
CMD ["npm", "start"]