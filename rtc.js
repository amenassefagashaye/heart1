// WebRTC peer connection management
class RTCManager {
    constructor() {
        this.peerConnections = new Map();
        this.localStream = null;
        this.dataChannels = new Map();
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
    }

    // Initialize peer connection
    async createPeerConnection(peerId, isInitiator = false) {
        if (this.peerConnections.has(peerId)) {
            return this.peerConnections.get(peerId);
        }

        const pc = new RTCPeerConnection(this.configuration);
        this.peerConnections.set(peerId, pc);

        // Add data channel for game data
        if (isInitiator) {
            const dataChannel = pc.createDataChannel('game-data', {
                ordered: true,
                maxRetransmits: 3
            });
            this.setupDataChannel(dataChannel, peerId);
        } else {
            pc.ondatachannel = (event) => {
                this.setupDataChannel(event.channel, peerId);
            };
        }

        // ICE candidate handling
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendToServer({
                    type: 'ice-candidate',
                    target: peerId,
                    candidate: event.candidate
                });
            }
        };

        // Connection state tracking
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            
            if (pc.connectionState === 'disconnected' || 
                pc.connectionState === 'failed' || 
                pc.connectionState === 'closed') {
                this.cleanupPeer(peerId);
                broadcastPlayerDisconnected(peerId);
            }
        };

        return pc;
    }

    // Setup data channel
    setupDataChannel(channel, peerId) {
        this.dataChannels.set(peerId, channel);

        channel.onopen = () => {
            console.log(`Data channel with ${peerId} opened`);
            sendGameStateToPeer(peerId);
        };

        channel.onmessage = (event) => {
            this.handleDataMessage(event.data, peerId);
        };

        channel.onclose = () => {
            console.log(`Data channel with ${peerId} closed`);
            this.dataChannels.delete(peerId);
        };

        channel.onerror = (error) => {
            console.error(`Data channel error with ${peerId}:`, error);
        };
    }

    // Handle incoming data messages
    handleDataMessage(data, peerId) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'game-action':
                    handleGameAction(message.action, peerId);
                    break;
                case 'chat':
                    broadcastChatMessage(message, peerId);
                    break;
                case 'state-sync':
                    syncGameState(message.state);
                    break;
                case 'ping':
                    this.sendToPeer(peerId, { type: 'pong' });
                    break;
            }
        } catch (error) {
            console.error('Error handling data message:', error);
        }
    }

    // Send message to specific peer
    sendToPeer(peerId, message) {
        const channel = this.dataChannels.get(peerId);
        if (channel && channel.readyState === 'open') {
            channel.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    // Broadcast to all peers
    broadcast(message, excludePeer = null) {
        let successCount = 0;
        this.dataChannels.forEach((channel, peerId) => {
            if (peerId !== excludePeer && channel.readyState === 'open') {
                channel.send(JSON.stringify(message));
                successCount++;
            }
        });
        return successCount;
    }

    // Create offer
    async createOffer(peerId) {
        const pc = await this.createPeerConnection(peerId, true);
        
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            return {
                type: 'offer',
                target: peerId,
                sdp: offer.sdp
            };
        } catch (error) {
            console.error('Error creating offer:', error);
            this.cleanupPeer(peerId);
            throw error;
        }
    }

    // Handle incoming offer
    async handleOffer(peerId, sdp) {
        const pc = await this.createPeerConnection(peerId, false);
        
        try {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            return {
                type: 'answer',
                target: peerId,
                sdp: answer.sdp
            };
        } catch (error) {
            console.error('Error handling offer:', error);
            this.cleanupPeer(peerId);
            throw error;
        }
    }

    // Handle incoming answer
    async handleAnswer(peerId, sdp) {
        const pc = this.peerConnections.get(peerId);
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
            } catch (error) {
                console.error('Error handling answer:', error);
                this.cleanupPeer(peerId);
            }
        }
    }

    // Add ICE candidate
    async addIceCandidate(peerId, candidate) {
        const pc = this.peerConnections.get(peerId);
        if (pc && pc.remoteDescription) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        }
    }

    // Cleanup peer connection
    cleanupPeer(peerId) {
        const pc = this.peerConnections.get(peerId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(peerId);
        }
        
        const channel = this.dataChannels.get(peerId);
        if (channel) {
            channel.close();
            this.dataChannels.delete(peerId);
        }
    }

    // Cleanup all connections
    cleanupAll() {
        this.peerConnections.forEach((pc, peerId) => {
            pc.close();
        });
        this.peerConnections.clear();
        
        this.dataChannels.forEach((channel, peerId) => {
            channel.close();
        });
        this.dataChannels.clear();
    }

    // Get connection status
    getConnectionStatus() {
        const status = {};
        this.peerConnections.forEach((pc, peerId) => {
            status[peerId] = {
                connectionState: pc.connectionState,
                iceConnectionState: pc.iceConnectionState,
                dataChannelState: this.dataChannels.get(peerId)?.readyState || 'closed'
            };
        });
        return status;
    }
}

// Global RTC manager instance
const rtcManager = new RTCManager();

// Export for use in other files
window.RTCManager = rtcManager;