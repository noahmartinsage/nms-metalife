import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, Keyboard, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";

/**
 * 扫码组件：优先真实摄像头 + BarcodeDetector，不可用时降级为手动输入。
 * 输出：onScan({ raw, code })
 */
export default function SmartScanner({ onScan, sampleCode = "NMS-STORE-0001" }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);

  const [state, setState] = useState("idle"); // idle | starting | scanning | unsupported | denied
  const [manual, setManual] = useState("");
  const [lastCode, setLastCode] = useState("");

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setState("idle");
  };

  useEffect(() => () => stop(), []);

  const tick = async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState !== 4) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    try {
      const codes = await detector.detect(video);
      if (codes && codes.length > 0) {
        const raw = codes[0].rawValue || "";
        if (raw && raw !== lastCode) {
          setLastCode(raw);
          onScan?.({ raw, code: raw.trim() });
          stop();
          toast.success("识别成功");
          return;
        }
      }
    } catch (e) {
      /* 帧识别失败忽略，继续下一帧 */
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      toast.error("当前环境不支持摄像头，请手动输入收款码");
      return;
    }
    if (!("BarcodeDetector" in window)) {
      setState("unsupported");
      toast.warning("当前浏览器不支持二维码识别，请手动输入收款码");
      return;
    }

    setState("starting");
    try {
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("scanning");
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setState("denied");
      toast.error("无法访问摄像头（需 HTTPS 或 localhost 并授权）");
    }
  };

  const submitManual = () => {
    const code = manual.trim().toUpperCase();
    if (!code) {
      toast.error("请输入商家收款码");
      return;
    }
    onScan?.({ raw: code, code });
    setManual("");
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-medium">
          <ScanLine className="h-3 w-3 text-cyan-300" /> 扫描商家收款码
        </span>
        <Badge variant={state === "scanning" ? "success" : "outline"}>
          {state === "scanning" ? "识别中" : state === "idle" ? "待启动" : "降级模式"}
        </Badge>
      </div>

      <div className="relative mt-2 grid h-36 place-items-center overflow-hidden rounded-lg border border-dashed border-cyan-400/25 bg-[#070d19]">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${state === "scanning" ? "opacity-100" : "opacity-0"}`}
        />
        {state !== "scanning" && (
          <div className="relative text-center">
            <Camera className="mx-auto h-7 w-7 text-cyan-300/70" />
            <p className="mt-1 text-[9px] text-muted-foreground">
              {state === "unsupported"
                ? "环境不支持自动识别，请手动输入"
                : state === "denied"
                  ? "摄像头被拒绝，请手动输入"
                  : "点击「启动摄像头」扫描门店二维码"}
            </p>
          </div>
        )}
        {state === "scanning" && (
          <>
            <div className="pointer-events-none absolute inset-5 rounded border-2 border-cyan-400/60" />
            <div className="pointer-events-none absolute left-5 right-5 top-1/2 h-0.5 animate-pulse-glow bg-cyan-400/80" />
          </>
        )}
      </div>

      <div className="mt-2 flex gap-1.5">
        {state === "scanning" ? (
          <Button size="sm" variant="outline" className="flex-1" onClick={stop}>
            <CameraOff className="h-3 w-3" /> 停止扫描
          </Button>
        ) : (
          <Button size="sm" className="flex-1" onClick={start}>
            <Camera className="h-3 w-3" /> 启动摄像头
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setManual(sampleCode);
            toast.message("已填入示例收款码，可直接提交");
          }}
        >
          <Check className="h-3 w-3" /> 用示例码
        </Button>
      </div>

      <div className="mt-1.5 flex gap-1">
        <div className="relative flex-1">
          <Keyboard className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            placeholder="手动输入收款码，如 NMS-STORE-0001"
            className="h-8 pl-7 text-[10px]"
          />
        </div>
        <Button size="sm" variant="outline" onClick={submitManual}>
          确认
        </Button>
      </div>
      <p className="mt-1 text-[8px] leading-relaxed text-muted-foreground">
        摄像头识别需 HTTPS 或 localhost；不支持 BarcodeDetector 的浏览器自动降级为手动输入，不影响支付流程。
      </p>
    </div>
  );
}
