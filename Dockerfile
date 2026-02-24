FROM node:20-alpine

# Install ffmpeg/ffplay for audio playback if enabled
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Create output directory for audio files
RUN mkdir -p /app/data/out

EXPOSE 3000

CMD ["npm", "start"]
