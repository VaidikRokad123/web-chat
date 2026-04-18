import { useState, useEffect, useRef, useCallback } from 'react';
import './CallModal.css';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export default function CallModal({ socket, callState, onClose }) {
  const { type, direction, targetUserId, targetName, targetAvatar, offer } = callState;
  const [status, setStatus] = useState(direction === 'outgoing' ? 'calling' : 'ringing');
  const [duration, setDuration] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
  }, []);

  const endCall = useCallback(() => {
    socket?.emit('end-call', { targetUserId });
    cleanup();
    onClose();
  }, [socket, targetUserId, cleanup, onClose]);

  // Setup peer connection
  const createPeer = useCallback(() => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit('ice-candidate', { targetUserId, candidate: e.candidate });
      }
    };

    peer.ontrack = (e) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') {
        setStatus('connected');
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      }
      if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
        endCall();
      }
    };

    peerRef.current = peer;
    return peer;
  }, [socket, targetUserId, endCall]);

  // Start outgoing call
  useEffect(() => {
    if (direction !== 'outgoing') return;

    async function startCall() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video',
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = createPeer();
        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const offerDesc = await peer.createOffer();
        await peer.setLocalDescription(offerDesc);

        socket?.emit('call-user', {
          targetUserId,
          offer: offerDesc,
          callType: type,
        });
      } catch (err) {
        console.error('Failed to start call:', err);
        endCall();
      }
    }

    startCall();
    return cleanup;
  }, []); // eslint-disable-line

  // Handle incoming call acceptance
  async function acceptCall() {
    try {
      setStatus('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const peer = createPeer();
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket?.emit('call-accepted', { targetUserId, answer });
    } catch (err) {
      console.error('Failed to accept call:', err);
      endCall();
    }
  }

  function rejectCall() {
    socket?.emit('call-rejected', { targetUserId });
    onClose();
  }

  // Listen for call events
  useEffect(() => {
    if (!socket) return;

    function onCallAccepted({ answer }) {
      if (peerRef.current) {
        peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setStatus('connecting');
      }
    }

    function onCallRejected() {
      setStatus('rejected');
      setTimeout(() => { cleanup(); onClose(); }, 1500);
    }

    function onIceCandidate({ candidate }) {
      if (peerRef.current && candidate) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    }

    function onCallEnded() {
      cleanup();
      onClose();
    }

    socket.on('call-accepted', onCallAccepted);
    socket.on('call-rejected', onCallRejected);
    socket.on('ice-candidate', onIceCandidate);
    socket.on('call-ended', onCallEnded);

    return () => {
      socket.off('call-accepted', onCallAccepted);
      socket.off('call-rejected', onCallRejected);
      socket.off('ice-candidate', onIceCandidate);
      socket.off('call-ended', onCallEnded);
    };
  }, [socket, cleanup, onClose]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="call-modal-overlay">
      <div className={`call-modal ${type === 'video' ? 'video-mode' : ''}`}>
        {/* Video elements */}
        {type === 'video' && (
          <div className="call-videos">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
          </div>
        )}

        {/* Call info */}
        <div className="call-info">
          {targetAvatar ? (
            <img src={targetAvatar} alt="" className="call-avatar" />
          ) : (
            <div className="call-avatar-placeholder">
              {(targetName || 'U')[0].toUpperCase()}
            </div>
          )}
          <h3 className="call-name">{targetName || 'User'}</h3>
          <p className="call-status">
            {status === 'calling' && 'Calling…'}
            {status === 'ringing' && `Incoming ${type} call…`}
            {status === 'connecting' && 'Connecting…'}
            {status === 'connected' && formatTime(duration)}
            {status === 'rejected' && 'Call rejected'}
          </p>
        </div>

        {/* Call actions */}
        <div className="call-actions">
          {status === 'ringing' && (
            <>
              <button className="call-btn accept" onClick={acceptCall} title="Accept">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
              <button className="call-btn reject" onClick={rejectCall} title="Reject">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </>
          )}
          {(status === 'calling' || status === 'connecting' || status === 'connected') && (
            <button className="call-btn end" onClick={endCall} title="End Call">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
