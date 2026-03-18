import { useRef, useEffect, useCallback } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260308_114720_3dabeb9e-2c39-4907-b747-bc3544e2d5b7.mp4";

export default function SocialProofSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const fadeLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const { currentTime, duration } = video;
    if (!duration || isNaN(duration)) {
      requestAnimationFrame(fadeLoop);
      return;
    }

    const fadeTime = 0.5;
    let opacity = 1;

    if (currentTime < fadeTime) {
      opacity = currentTime / fadeTime;
    } else if (currentTime > duration - fadeTime) {
      opacity = (duration - currentTime) / fadeTime;
    }

    video.style.opacity = String(Math.max(0, Math.min(1, opacity)));
    requestAnimationFrame(fadeLoop);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const raf = requestAnimationFrame(fadeLoop);

    const handleEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => {
        video.currentTime = 0;
        video.play();
      }, 100);
    };

    video.addEventListener("ended", handleEnded);
    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("ended", handleEnded);
    };
  }, [fadeLoop]);

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0 }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/20 to-background" />

      {/* Content spacer for video visibility */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-16 px-4">
        <div className="h-64" />
      </div>
    </section>
  );
}
