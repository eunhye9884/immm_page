"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import JSZip from "jszip";
import { Upload, Settings, CheckCircle2, XCircle, ArrowRight, Check, X, Download } from "lucide-react";

// Channel configurations
interface ChannelConfig {
  name: string;
  width: number;
  thumbSize: number;
  maxH: number;
  splitH: number | null;
  info: string;
}

const CHANNELS: Record<string, ChannelConfig> = {
  jasamall: {
    name: "자사몰",
    width: 1000,
    thumbSize: 1000,
    maxH: 99999,
    splitH: null,
    info: "자사몰 규격: 가로 1000px (세로 제한 없음) / 썸네일 1000x1000px"
  },
  smartstore: {
    name: "스마트스토어",
    width: 860,
    thumbSize: 1000,
    maxH: 5000,
    splitH: null,
    info: "스마트스토어 규격: 가로 860px (세로 최대 5,000px 권장) / 썸네일 1000x1000px"
  },
  coupang: {
    name: "쿠팡",
    width: 780,
    thumbSize: 1000,
    maxH: 30000,
    splitH: null,
    info: "쿠팡 규격: 가로 780px (세로 최대 30,000px) / 썸네일 1000x1000px"
  },
  cm29: {
    name: "29CM",
    width: 860,
    thumbSize: 1000,
    maxH: 99999,
    splitH: 8000,
    info: "29CM 규격: 가로 860px (세로 8,000px 초과 시 자동 분할 다운로드) / 썸네일 1000x1000px"
  },
  musinsa: {
    name: "무신사",
    width: 1500,
    thumbSize: 1500,
    maxH: 1500,
    splitH: 1500, // Musinsa detailed page consists of 1500x1500px square blocks
    info: "무신사 규격: 가로 1500px / 세로 1500px (1:1 정방형 슬라이드 고정) / 썸네일 1500x1500px"
  },
  wconcept: {
    name: "W컨셉",
    width: 860,
    thumbSize: 1000,
    maxH: 5000,
    splitH: null,
    info: "W컨셉 규격: 가로 860px (세로 최대 5,000px) / 썸네일 1000x1000px"
  }
};

interface UploadedImage {
  id: string;
  file: File;
  src: string;
  imgElement: HTMLImageElement;
}

export default function Home() {
  // Brand assets and presets state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [brandName, setBrandName] = useState("immm BAGS");
  const [tags, setTags] = useState<string[]>(["캔버스 코튼", "천연 소가죽"]);
  const [newTagText, setNewTagText] = useState("");
  const [policyPreset, setPolicyPreset] = useState("default");
  const [customPolicyText, setCustomPolicyText] = useState("");
  const [activeChannel, setActiveChannel] = useState("smartstore");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isZipGenerating, setIsZipGenerating] = useState(false);
  const [sliceGuides, setSliceGuides] = useState<{ y: number; label: string }[]>([]);
  const [splitThreshold29cm, setSplitThreshold29cm] = useState<number>(8000);

  const getChannelSplitH = (channelKey: string, config: ChannelConfig) => {
    if (channelKey === "cm29") return splitThreshold29cm;
    return config.splitH;
  };

  // Canvas Refs
  const thumbnailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Policy text helper
  const getPolicyText = () => {
    if (policyPreset === "default") {
      return "[시즌 오프] 전 상품 15% 특별 할인 및 도서산간 포함 전국 무료 배송 서비스 제공";
    } else if (policyPreset === "preorder") {
      return "[프리오더 안내] 신제품 출시 기념 20% 얼리버드 혜택 / 주문 제작 상품으로 영업일 기준 7~10일 내 순차 배송";
    } else if (policyPreset === "limited") {
      return "[한정 수량 발매] 리미티드 에디션 회원 전용 10% 쿠폰 할인 / 한정 수량 소진 시 즉시 마감 및 당일 즉시 발송";
    } else {
      return customPolicyText.trim() || "[공지] 고객 안심 배송 및 무상 A/S 1년 보증 혜택 적용 상품";
    }
  };

  // Upload actions
  const handleUploadClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const remainingSlots = 3 - uploadedImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      if (uploadedImages.length >= 3) {
        alert("가방 이미지는 최대 3개까지 업로드할 수 있습니다.");
      }
      return;
    }

    filesToUpload.forEach(file => {
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setUploadedImages(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              file: file,
              src: e.target?.result as string,
              imgElement: img
            }
          ].slice(0, 3)); // Hard cap at 3
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const deleteUploadedImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  // Tags management
  const addTag = () => {
    const val = newTagText.trim();
    if (val && !tags.includes(val)) {
      setTags(prev => [...prev, val]);
      setNewTagText("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Helper rounded rect for canvas
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Helper wrapping text on canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ");
    let line = "";
    let testY = y;
    ctx.textAlign = "center";

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, testY);
        line = words[n] + " ";
        testY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, testY);
  };

  // Primary Draw effect loop
  useEffect(() => {
    if (uploadedImages.length === 0) {
      setSliceGuides([]);
      return;
    }

    const chan = CHANNELS[activeChannel];
    
    // --- 1. Draw Thumbnail ---
    const tCanvas = thumbnailCanvasRef.current;
    if (tCanvas) {
      const tCtx = tCanvas.getContext("2d");
      if (tCtx) {
        const size = chan.thumbSize;
        tCanvas.width = size;
        tCanvas.height = size;
        
        tCtx.fillStyle = "#f5f6f8";
        tCtx.fillRect(0, 0, size, size);

        // draw grid pattern
        tCtx.strokeStyle = "rgba(0, 0, 0, 0.02)";
        tCtx.lineWidth = 1;
        const gridSpacing = size / 20;
        for (let i = 0; i < size; i += gridSpacing) {
          tCtx.beginPath();
          tCtx.moveTo(i, 0); tCtx.lineTo(i, size);
          tCtx.moveTo(0, i); tCtx.lineTo(size, i);
          tCtx.stroke();
        }

        // draw image (the first one)
        const mainImg = uploadedImages[0].imgElement;
        const padding = size * 0.1;
        const maxW = size - padding * 2;
        const maxH = size - padding * 2;

        let w = mainImg.width;
        let h = mainImg.height;
        const ratio = Math.min(maxW / w, maxH / h);
        w = w * ratio;
        h = h * ratio;

        const x = (size - w) / 2;
        const y = (size - h) / 2;

        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = "high";
        tCtx.drawImage(mainImg, x, y, w, h);

        // Brand logo banner bottom
        const barHeight = size * 0.08;
        const gradient = tCtx.createLinearGradient(0, size - barHeight, 0, size);
        gradient.addColorStop(0, "rgba(7, 9, 14, 0)");
        gradient.addColorStop(1, "rgba(7, 9, 14, 0.6)");
        tCtx.fillStyle = gradient;
        tCtx.fillRect(0, size - barHeight, size, barHeight);

        tCtx.fillStyle = "rgba(0, 0, 0, 0.85)";
        tCtx.font = `bold ${Math.max(16, size * 0.028)}px var(--font-heading), sans-serif`;
        tCtx.textAlign = "center";
        tCtx.textBaseline = "middle";

        const textWidth = tCtx.measureText(brandName).width;
        const tagW = textWidth + (size * 0.05);
        const tagH = size * 0.05;

        tCtx.fillStyle = "rgba(255, 255, 255, 0.95)";
        drawRoundedRect(tCtx, (size - tagW) / 2, size - tagH - (size * 0.03), tagW, tagH, 4);
        tCtx.fill();

        tCtx.fillStyle = "#07090e";
        tCtx.fillText(brandName.toUpperCase(), size / 2, size - (tagH / 2) - (size * 0.03));
      }
    }

    // --- 2. Draw Detail Page ---
    const dCanvas = detailCanvasRef.current;
    if (dCanvas) {
      const dCtx = dCanvas.getContext("2d");
      if (dCtx) {
        const width = chan.width;
        const headerH = 220;
        const spacingH = 40;
        
        let imagesTotalH = 0;
        const scaledImgDims: { w: number; h: number; el: HTMLImageElement }[] = [];

        uploadedImages.forEach(imgObj => {
          const img = imgObj.imgElement;
          const scale = (width - 48) / img.width;
          const h = img.height * scale;
          scaledImgDims.push({ w: width - 48, h, el: img });
          imagesTotalH += h + spacingH;
        });

        const infoH = 280;
        const footerH = 180;
        const totalH = headerH + imagesTotalH + infoH + footerH;

        dCanvas.width = width;
        dCanvas.height = totalH;

        dCtx.imageSmoothingEnabled = true;
        dCtx.imageSmoothingQuality = "high";

        // Background
        dCtx.fillStyle = "#ffffff";
        dCtx.fillRect(0, 0, width, totalH);

        let currY = 0;

        // Header
        dCtx.fillStyle = "#07090e";
        dCtx.fillRect(0, 0, width, headerH);
        
        dCtx.fillStyle = "#8b5cf6";
        dCtx.fillRect(0, headerH - 4, width, 4);

        dCtx.fillStyle = "#ffffff";
        dCtx.font = "bold 26px var(--font-heading), sans-serif";
        dCtx.textAlign = "center";
        dCtx.textBaseline = "middle";
        dCtx.fillText(brandName.toUpperCase(), width / 2, 85);

        dCtx.fillStyle = "#94a3b8";
        dCtx.font = "500 12px var(--font-heading), sans-serif";
        dCtx.fillText("SEASON COLLECTION LOOKBOOK", width / 2, 125);

        dCtx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        dCtx.lineWidth = 1;
        dCtx.beginPath();
        dCtx.moveTo((width / 2) - 40, 145);
        dCtx.lineTo((width / 2) + 40, 145);
        dCtx.stroke();

        dCtx.fillStyle = "#f8fafc";
        dCtx.font = "400 11px var(--font-body), sans-serif";
        dCtx.fillText("본 상세페이지는 immm 솔루션으로 자동 최적화되었습니다.", width / 2, 170);

        currY = headerH;

        // Images layout
        scaledImgDims.forEach((dim, idx) => {
          currY += spacingH / 2;
          
          dCtx.strokeStyle = "#e2e8f0";
          dCtx.lineWidth = 1;
          dCtx.strokeRect(24, currY, dim.w, dim.h);
          dCtx.drawImage(dim.el, 24, currY, dim.w, dim.h);
          
          dCtx.fillStyle = "#64748b";
          dCtx.font = "italic 11px var(--font-heading), sans-serif";
          dCtx.textAlign = "right";
          dCtx.fillText(`LOOK ${String(idx + 1).padStart(2, '0')}`, width - 24, currY + dim.h + 20);

          currY += dim.h + (spacingH / 2);
        });

        // Spec box
        dCtx.fillStyle = "#f8fafc";
        dCtx.fillRect(0, currY, width, infoH);
        
        dCtx.strokeStyle = "#e2e8f0";
        dCtx.lineWidth = 1;
        dCtx.beginPath();
        dCtx.moveTo(0, currY); dCtx.lineTo(width, currY);
        dCtx.moveTo(0, currY + infoH); dCtx.lineTo(width, currY + infoH);
        dCtx.stroke();

        dCtx.fillStyle = "#0f172a";
        dCtx.font = "bold 16px var(--font-heading), sans-serif";
        dCtx.textAlign = "left";
        dCtx.fillText("PRODUCT DETAILS", 32, currY + 45);

        dCtx.fillStyle = "#475569";
        dCtx.font = "400 13px var(--font-body), sans-serif";
        dCtx.fillText("• 정교한 마감과 유행을 타지 않는 실루엣으로 완성한 시그니처 숄더백", 32, currY + 80);
        dCtx.fillText("• 자연스러운 형태 보존을 위한 스티칭 공법 및 고급 하드웨어 부자재 적용", 32, currY + 105);
        dCtx.fillText("• 넉넉한 내부 수납력과 프론트 퀵 포켓으로 활용도 높은 수납 공간 설계", 32, currY + 130);

        dCtx.fillStyle = "#334155";
        dCtx.font = "bold 13px var(--font-body), sans-serif";
        dCtx.fillText("주요 소재 정보", 32, currY + 175);

        // Tags pills draw
        let pillX = 32;
        let pillY = currY + 195;
        dCtx.font = "500 12px var(--font-body), sans-serif";
        
        tags.forEach(tag => {
          const textWidth = dCtx.measureText(tag).width;
          const pillW = textWidth + 20;
          const pillH = 26;

          if (pillX + pillW > width - 32) {
            pillX = 32;
            pillY += 32;
          }

          dCtx.fillStyle = "#7c3aed";
          drawRoundedRect(dCtx, pillX, pillY, pillW, pillH, 4);
          dCtx.fill();

          dCtx.fillStyle = "#ffffff";
          dCtx.textAlign = "center";
          dCtx.fillText(tag, pillX + pillW / 2, pillY + pillH / 2 + 1);

          pillX += pillW + 8;
        });

        currY += infoH;

        // Policy Footer
        dCtx.fillStyle = "#ffffff";
        dCtx.strokeStyle = "#cbd5e1";
        dCtx.lineWidth = 1;
        drawRoundedRect(dCtx, 24, currY + 24, width - 48, footerH - 48, 6);
        dCtx.stroke();

        dCtx.fillStyle = "#0f172a";
        dCtx.font = "bold 12px var(--font-body), sans-serif";
        dCtx.textAlign = "center";
        dCtx.fillText("배송 및 구매 유의사항", width / 2, currY + 48);

        dCtx.fillStyle = "#64748b";
        dCtx.font = "400 12px var(--font-body), sans-serif";
        wrapText(dCtx, getPolicyText(), width / 2, currY + 80, width - 80, 20);

        // Calculate visual slices Guides
        const currentSplitH = getChannelSplitH(activeChannel, chan);
        if (currentSplitH && totalH > currentSplitH) {
          const numSlices = Math.ceil(totalH / currentSplitH);
          const scrollAreaHeight = dCanvas.offsetHeight || (totalH * (dCanvas.clientWidth / width));
          const scalingFactor = scrollAreaHeight / totalH;
          
          const guides = [];
          for (let i = 1; i < numSlices; i++) {
            const splitY = i * currentSplitH;
            guides.push({
              y: splitY * scalingFactor,
              label: `${i}번 분할선 (${splitY}px)`
            });
          }
          setSliceGuides(guides);
        } else {
          setSliceGuides([]);
        }
      }
    }
  }, [uploadedImages, brandName, tags, policyPreset, customPolicyText, activeChannel, splitThreshold29cm]);

  // Single download helper functions
  const downloadThumbnail = () => {
    const tCanvas = thumbnailCanvasRef.current;
    if (!tCanvas || uploadedImages.length === 0) return;
    const brand = brandName.trim().toLowerCase().replace(/\s+/g, "_") || "immm";
    const link = document.createElement("a");
    link.download = `${brand}_${activeChannel}_thumbnail.png`;
    link.href = tCanvas.toDataURL("image/png");
    link.click();
  };

  const downloadDetail = async () => {
    const dCanvas = detailCanvasRef.current;
    if (!dCanvas || uploadedImages.length === 0) return;
    
    const chan = CHANNELS[activeChannel];
    const brand = brandName.trim().toLowerCase().replace(/\s+/g, "_") || "immm";
    const currentSplitH = getChannelSplitH(activeChannel, chan);

    if (currentSplitH && dCanvas.height > currentSplitH) {
      const zip = new JSZip();
      const totalH = dCanvas.height;
      const sliceH = currentSplitH;
      const numSlices = Math.ceil(totalH / sliceH);

      for (let i = 0; i < numSlices; i++) {
        const yOffset = i * sliceH;
        const currentSliceH = Math.min(sliceH, totalH - yOffset);
        
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = chan.width;
        tempCanvas.height = currentSliceH;
        const tempCtx = tempCanvas.getContext("2d");
        
        if (tempCtx) {
          tempCtx.drawImage(
            dCanvas,
            0, yOffset, chan.width, currentSliceH,
            0, 0, chan.width, currentSliceH
          );
          const dataUrl = tempCanvas.toDataURL("image/png").substring(tempCanvas.toDataURL("image/png").indexOf(",") + 1);
          zip.file(`${brand}_detail_part${i + 1}.png`, dataUrl, { base64: true });
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `${brand}_${activeChannel}_details_split.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();
    } else {
      const link = document.createElement("a");
      link.download = `${brand}_${activeChannel}_detail.png`;
      link.href = dCanvas.toDataURL("image/png");
      link.click();
    }
  };

  // ZIP Bulk download logic
  const downloadAllChannelsZip = async () => {
    if (uploadedImages.length === 0) return;
    setIsZipGenerating(true);

    try {
      const zip = new JSZip();
      const brand = brandName.trim().toLowerCase().replace(/\s+/g, "_") || "immm";
      
      const originalActiveChannel = activeChannel;
      
      // Temporarily write for each channel to generate graphics
      for (const [key, chan] of Object.entries(CHANNELS)) {
        // Draw temporarily on canvas
        const tCanvas = document.createElement("canvas");
        const dCanvas = document.createElement("canvas");
        const tCtx = tCanvas.getContext("2d");
        const dCtx = dCanvas.getContext("2d");

        if (tCtx && dCtx) {
          // --- Draw Thumbnail ---
          const size = chan.thumbSize;
          tCanvas.width = size;
          tCanvas.height = size;
          tCtx.fillStyle = "#f5f6f8";
          tCtx.fillRect(0, 0, size, size);

          const mainImg = uploadedImages[0].imgElement;
          const padding = size * 0.1;
          const maxW = size - padding * 2;
          const maxH = size - padding * 2;
          let w = mainImg.width;
          let h = mainImg.height;
          const ratio = Math.min(maxW / w, maxH / h);
          w = w * ratio;
          h = h * ratio;
          tCtx.drawImage(mainImg, (size - w) / 2, (size - h) / 2, w, h);

          const barHeight = size * 0.08;
          const gradient = tCtx.createLinearGradient(0, size - barHeight, 0, size);
          gradient.addColorStop(0, "rgba(7, 9, 14, 0)");
          gradient.addColorStop(1, "rgba(7, 9, 14, 0.6)");
          tCtx.fillStyle = gradient;
          tCtx.fillRect(0, size - barHeight, size, barHeight);

          tCtx.fillStyle = "rgba(0, 0, 0, 0.85)";
          tCtx.font = `bold ${Math.max(16, size * 0.028)}px sans-serif`;
          tCtx.textAlign = "center";
          tCtx.textBaseline = "middle";
          const textWidth = tCtx.measureText(brandName).width;
          const tagW = textWidth + (size * 0.05);
          const tagH = size * 0.05;
          tCtx.fillStyle = "rgba(255, 255, 255, 0.95)";
          drawRoundedRect(tCtx, (size - tagW) / 2, size - tagH - (size * 0.03), tagW, tagH, 4);
          tCtx.fill();
          tCtx.fillStyle = "#07090e";
          tCtx.fillText(brandName.toUpperCase(), size / 2, size - (tagH / 2) - (size * 0.03));

          const thumbBase64 = tCanvas.toDataURL("image/png").substring(tCanvas.toDataURL("image/png").indexOf(",") + 1);
          const folderName = getFolderName(key);
          zip.file(`${folderName}/${key}_thumbnail.png`, thumbBase64, { base64: true });

          // --- Draw Detail page ---
          const width = chan.width;
          const headerH = 220;
          const spacingH = 40;
          let imagesTotalH = 0;
          const scaledDims: { w: number; h: number; el: HTMLImageElement }[] = [];

          uploadedImages.forEach(imgObj => {
            const img = imgObj.imgElement;
            const scale = (width - 48) / img.width;
            const h = img.height * scale;
            scaledDims.push({ w: width - 48, h, el: img });
            imagesTotalH += h + spacingH;
          });

          const infoH = 280;
          const footerH = 180;
          const totalH = headerH + imagesTotalH + infoH + footerH;

          dCanvas.width = width;
          dCanvas.height = totalH;

          dCtx.fillStyle = "#ffffff";
          dCtx.fillRect(0, 0, width, totalH);

          let currY = 0;
          // header
          dCtx.fillStyle = "#07090e";
          dCtx.fillRect(0, 0, width, headerH);
          dCtx.fillStyle = "#8b5cf6";
          dCtx.fillRect(0, headerH - 4, width, 4);
          dCtx.fillStyle = "#ffffff";
          dCtx.font = "bold 26px sans-serif";
          dCtx.textAlign = "center";
          dCtx.textBaseline = "middle";
          dCtx.fillText(brandName.toUpperCase(), width / 2, 85);
          dCtx.fillStyle = "#94a3b8";
          dCtx.font = "500 12px sans-serif";
          dCtx.fillText("SEASON COLLECTION LOOKBOOK", width / 2, 125);
          dCtx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          dCtx.lineWidth = 1;
          dCtx.beginPath();
          dCtx.moveTo((width / 2) - 40, 145);
          dCtx.lineTo((width / 2) + 40, 145);
          dCtx.stroke();
          dCtx.fillStyle = "#f8fafc";
          dCtx.font = "400 11px sans-serif";
          dCtx.fillText("본 상세페이지는 immm 솔루션으로 자동 최적화되었습니다.", width / 2, 170);

          currY = headerH;

          // Images
          scaledDims.forEach((dim, idx) => {
            currY += spacingH / 2;
            dCtx.strokeStyle = "#e2e8f0";
            dCtx.lineWidth = 1;
            dCtx.strokeRect(24, currY, dim.w, dim.h);
            dCtx.drawImage(dim.el, 24, currY, dim.w, dim.h);
            dCtx.fillStyle = "#64748b";
            dCtx.font = "italic 11px sans-serif";
            dCtx.textAlign = "right";
            dCtx.fillText(`LOOK ${String(idx + 1).padStart(2, '0')}`, width - 24, currY + dim.h + 20);
            currY += dim.h + (spacingH / 2);
          });

          // Specs Box
          dCtx.fillStyle = "#f8fafc";
          dCtx.fillRect(0, currY, width, infoH);
          dCtx.strokeStyle = "#e2e8f0";
          dCtx.lineWidth = 1;
          dCtx.beginPath();
          dCtx.moveTo(0, currY); dCtx.lineTo(width, currY);
          dCtx.moveTo(0, currY + infoH); dCtx.lineTo(width, currY + infoH);
          dCtx.stroke();

          dCtx.fillStyle = "#0f172a";
          dCtx.font = "bold 16px sans-serif";
          dCtx.textAlign = "left";
          dCtx.fillText("PRODUCT DETAILS", 32, currY + 45);

          dCtx.fillStyle = "#475569";
          dCtx.font = "400 13px sans-serif";
          dCtx.fillText("• 정교한 마감과 유행을 타지 않는 실루엣으로 완성한 시그니처 숄더백", 32, currY + 80);
          dCtx.fillText("• 자연스러운 형태 보존을 위한 스티칭 공법 및 고급 하드웨어 부자재 적용", 32, currY + 105);
          dCtx.fillText("• 넉넉한 내부 수납력과 프론트 퀵 포켓으로 활용도 높은 수납 공간 설계", 32, currY + 130);

          dCtx.fillStyle = "#334155";
          dCtx.font = "bold 13px sans-serif";
          dCtx.fillText("주요 소재 정보", 32, currY + 175);

          let pillX = 32;
          let pillY = currY + 195;
          dCtx.font = "500 12px sans-serif";
          tags.forEach(tag => {
            const textWidth = dCtx.measureText(tag).width;
            const pillW = textWidth + 20;
            const pillH = 26;
            if (pillX + pillW > width - 32) {
              pillX = 32;
              pillY += 32;
            }
            dCtx.fillStyle = "#7c3aed";
            drawRoundedRect(dCtx, pillX, pillY, pillW, pillH, 4);
            dCtx.fill();
            dCtx.fillStyle = "#ffffff";
            dCtx.textAlign = "center";
            dCtx.fillText(tag, pillX + pillW / 2, pillY + pillH / 2 + 1);
            pillX += pillW + 8;
          });

          currY += infoH;

          // Footer Policy
          dCtx.fillStyle = "#ffffff";
          dCtx.strokeStyle = "#cbd5e1";
          dCtx.lineWidth = 1;
          drawRoundedRect(dCtx, 24, currY + 24, width - 48, footerH - 48, 6);
          dCtx.stroke();
          dCtx.fillStyle = "#0f172a";
          dCtx.font = "bold 12px sans-serif";
          dCtx.textAlign = "center";
          dCtx.fillText("배송 및 구매 유의사항", width / 2, currY + 48);
          dCtx.fillStyle = "#64748b";
          dCtx.font = "400 12px sans-serif";
          wrapText(dCtx, getPolicyText(), width / 2, currY + 80, width - 80, 20);

          // Add to zip
          const currentSplitH = getChannelSplitH(key, chan);
          if (currentSplitH && totalH > currentSplitH) {
            const sliceH = currentSplitH;
            const numSlices = Math.ceil(totalH / sliceH);

            for (let i = 0; i < numSlices; i++) {
              const yOffset = i * sliceH;
              const currentSliceH = Math.min(sliceH, totalH - yOffset);
              
              const sCanvas = document.createElement("canvas");
              sCanvas.width = chan.width;
              sCanvas.height = currentSliceH;
              const sCtx = sCanvas.getContext("2d");
              if (sCtx) {
                sCtx.drawImage(
                  dCanvas,
                  0, yOffset, chan.width, currentSliceH,
                  0, 0, chan.width, currentSliceH
                );
                const sBase64 = sCanvas.toDataURL("image/png").substring(sCanvas.toDataURL("image/png").indexOf(",") + 1);
                zip.file(`${folderName}/${key}_detail_part${i + 1}.png`, sBase64, { base64: true });
              }
            }
          } else {
            const detailBase64 = dCanvas.toDataURL("image/png").substring(dCanvas.toDataURL("image/png").indexOf(",") + 1);
            zip.file(`${folderName}/${key}_detail.png`, detailBase64, { base64: true });
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = `${brand}_6_channels_detail_package.zip`;
      link.href = URL.createObjectURL(content);
      link.click();
      
    } catch (err) {
      console.error(err);
      alert("ZIP 패키지 생성에 실패했습니다.");
    } finally {
      setIsZipGenerating(false);
    }
  };

  const getFolderName = (channelKey: string) => {
    switch (channelKey) {
      case "smartstore": return "01_네이버스마트스토어";
      case "coupang": return "02_쿠팡";
      case "cm29": return "03_29CM";
      case "musinsa": return "04_무신사";
      case "wconcept": return "05_W컨셉";
      case "jasamall": return "06_자사몰";
      default: return "기타채널";
    }
  };

  return (
    <>
      {/* Background Glow */}
      <div className="glow-bg">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
      </div>

      {/* Navigation */}
      <header className="navbar">
        <div className="navbar-container">
          <a href="#" className="logo">
            <span className="logo-accent">immm</span>
            <span className="logo-text">Detail Studio</span>
          </a>
          <nav className="nav-links">
            <a href="#features">주요 기능</a>
            <a href="#playground">체험하기</a>
            <a href="#pricing">요금제</a>
            <a href="#faq">자주 묻는 질문</a>
          </nav>
          <div className="nav-cta">
            <a href="#playground" className="btn btn-secondary btn-sm">무료로 시작하기</a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container hero-container">
            <div className="hero-tag">
              <span className="pulse-dot"></span> 1인 브랜드 스마트 운영 솔루션
            </div>
            <h1 className="hero-title">
              가방 상세페이지 제작,<br />
              <span>단 한 번의 업로드</span>로 6대 채널 종결.
            </h1>
            <p className="hero-subtitle">
              채널마다 다른 가이드라인과 썸네일 규격 맞추느라 밤새지 마세요.<br />
              사진과 정보만 넣으면 <strong>자사몰, 스마트스토어, 쿠팡, 무신사, 29CM, W컨셉</strong> 규격에 맞춰 자동 편집 및 분할까지 한 번에 완료됩니다.
            </p>
            <div className="hero-actions">
              <a href="#playground" className="btn btn-primary btn-lg">지금 바로 체험해보기 (무료)</a>
              <a href="#features" className="btn btn-tertiary btn-lg">기능 더 알아보기</a>
            </div>
            
            {/* Hero Mockup */}
            <div className="hero-visual-wrapper">
              <div className="hero-visual">
                <div className="mockup-header">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                  <div className="mockup-title">immm Detail Studio Dashboard</div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-sidebar">
                    <div className="sidebar-item active">
                      <Upload size={18} />
                      <span>상세페이지 빌더</span>
                    </div>
                    <div className="sidebar-item">
                      <Settings size={18} />
                      <span>브랜드 자산</span>
                    </div>
                  </div>
                  <div className="mockup-main">
                    <div className="mockup-flow">
                      <div className="flow-step">
                        <div className="flow-icon upload-pulse">
                          <Upload size={24} />
                        </div>
                        <h4>1. 이미지 업로드</h4>
                        <p>가방 촬영 컷 드롭</p>
                      </div>
                      <div className="flow-arrow">
                        <ArrowRight size={20} />
                      </div>
                      <div className="flow-step">
                        <div className="flow-icon settings-spin">
                          <Settings size={24} />
                        </div>
                        <h4>2. 1-클릭 레이아웃</h4>
                        <p>로고 및 정보 자동 합성</p>
                      </div>
                      <div className="flow-arrow">
                        <ArrowRight size={20} />
                      </div>
                      <div className="flow-step">
                        <div className="flow-icon success-bounce">
                          <CheckCircle2 size={24} className="text-emerald-500" />
                        </div>
                        <h4>3. 6개 채널 규격 다운</h4>
                        <p>ZIP 압축 패키지 내보내기</p>
                      </div>
                    </div>
                    <div className="mockup-channels-strip">
                      <span className="channel-badge jasamall">자사몰 1000px</span>
                      <span className="channel-badge naver">SmartStore 860px</span>
                      <span className="channel-badge coupang">Coupang 780px</span>
                      <span className="channel-badge cm29">29CM 860px (Split)</span>
                      <span className="channel-badge musinsa">Musinsa 1500px Square</span>
                      <span className="channel-badge wconcept">W Concept 860px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AS-IS vs TO-BE Section */}
        <section className="comparison" id="features">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">아직도 포토샵으로 하루 종일 리사이징하고 계신가요?</h2>
              <p className="section-subtitle">1인 디자이너 겸 대표님의 시간은 소중합니다. immm으로 획기적인 운영 효율을 느껴보세요.</p>
            </div>
            <div className="comparison-grid">
              <div className="comparison-card before">
                <div className="card-badge">AS-IS (기존 작업 방식)</div>
                <h3>수동 포토샵 노가다 작업</h3>
                <ul className="comparison-list">
                  <li>
                    <XCircle size={20} className="icon-error" />
                    <span>채널마다 요구하는 가로 크기(780px, 860px 등)별로 일일이 캔버스 크기 재조정</span>
                  </li>
                  <li>
                    <XCircle size={20} className="icon-error" />
                    <span>29CM에서 용량 제한(세로 8,000px 이상) 걸리면 수동으로 조각조각 잘라내기</span>
                  </li>
                  <li>
                    <XCircle size={20} className="icon-error" />
                    <span>할인/배송 안내, 소재 정보, 로고 텍스트를 채널별로 복사-붙여넣기 수동 작업</span>
                  </li>
                  <li>
                    <XCircle size={20} className="icon-error" />
                    <span>모바일에서 긴급하게 수정사항 생기면 노트북 켜고 포토샵 켜야 함</span>
                  </li>
                </ul>
              </div>
              
              <div className="comparison-card after animate-glow">
                <div className="card-badge success">TO-BE (immm 솔루션)</div>
                <h3>1클릭 상세페이지 멀티 출력</h3>
                <ul className="comparison-list">
                  <li>
                    <Check size={20} className="icon-success" />
                    <span>사진 업로드 즉시 6개 쇼핑몰 규격 자동 스케일링</span>
                  </li>
                  <li>
                    <Check size={20} className="icon-success" />
                    <span>29CM 세로 8,000px 초과 시 똑똑하게 등분하여 자동 분할 슬라이싱</span>
                  </li>
                  <li>
                    <Check size={20} className="icon-success" />
                    <span>할인 안내, 브랜드 로고, 제품 사양을 프리셋으로 불러와 자동 합성</span>
                  </li>
                  <li>
                    <Check size={20} className="icon-success" />
                    <span>모바일 웹 최적화로 외부 이동 중에도 터치 몇 번에 즉시 완성</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Playground Section */}
        <section className="playground-section" id="playground">
          <div className="container">
            <div className="section-header">
              <div className="section-tag-glow">PLAYGROUND</div>
              <h2 className="section-title">스튜디오 직접 체험해보기</h2>
              <p className="section-subtitle">직접 가방 사진을 업로드하고 실시간으로 채널별 리사이징 및 분할 결과를 테스트해 보세요.</p>
            </div>
            
            <div className="playground-layout">
              {/* Left Settings */}
              <div className="control-panel">
                <div className="panel-section">
                  <h3>1. 가방 이미지 업로드 <span className="required">*</span></h3>
                  <div 
                    className={`upload-dropzone ${isDragOver ? "dragover" : ""}`}
                    onClick={handleUploadClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input 
                      type="file" 
                      ref={imageInputRef}
                      onChange={handleFileChange}
                      accept="image/*" 
                      multiple 
                      style={{ display: "none" }} 
                    />
                    <div className="upload-inner">
                      <Upload size={40} className="text-slate-500" />
                      <p className="upload-main-text">가방 이미지 드래그 또는 클릭</p>
                      <p className="upload-sub-text">최대 3장까지 추가 가능 (다중 파일 지원)</p>
                    </div>
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="uploaded-files-list">
                      {uploadedImages.map((img) => (
                        <div key={img.id} className="uploaded-file-item">
                          <img src={img.src} alt={img.file.name} />
                          <button 
                            type="button" 
                            className="delete-file-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUploadedImage(img.id);
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel-section">
                  <h3>2. 브랜드 자산 설정</h3>
                  
                  <div className="form-group">
                    <label htmlFor="brand-name-input">브랜드 명 (로고 텍스트)</label>
                    <input 
                      type="text" 
                      id="brand-name-input"
                      className="form-control" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="브랜드 명을 입력하세요"
                    />
                  </div>

                  <div className="form-group">
                    <label>가방 소재 (태그로 노출)</label>
                    <div className="tag-input-container">
                      <div className="tag-list">
                        {tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)}>
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="tag-input-wrapper">
                        <input 
                          type="text" 
                          className="form-control" 
                          value={newTagText}
                          onChange={(e) => setNewTagText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          placeholder="소재 입력 후 엔터"
                        />
                        <button type="button" onClick={addTag} className="btn btn-secondary btn-sm">추가</button>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="policy-preset-select">할인 & 배송 안내 문구 프리셋</label>
                    <select 
                      id="policy-preset-select" 
                      className="form-control"
                      value={policyPreset}
                      onChange={(e) => setPolicyPreset(e.target.value)}
                    >
                      <option value="default">[기본 프리셋] 시즌 오프 15% 세일 및 전 지역 무료 배송</option>
                      <option value="preorder">[예약 구매 프리셋] 프리오더 20% 세일 & 주문 제작으로 영업일 7일 내 순차 배송</option>
                      <option value="limited">[한정 수량 프리셋] 리미티드 에디션 10% 쿠폰 할인 / 당일 발송 가능</option>
                      <option value="custom">[직접 입력]</option>
                    </select>
                  </div>
                  {policyPreset === "custom" && (
                    <div className="form-group">
                      <label htmlFor="custom-policy-input">안내 문구 직접 작성</label>
                      <textarea 
                        id="custom-policy-input"
                        className="form-control" 
                        rows={3} 
                        value={customPolicyText}
                        onChange={(e) => setCustomPolicyText(e.target.value)}
                        placeholder="예: [안내] 가죽 전문 세탁을 권장합니다. 산간 지역은 배송비가 추가됩니다."
                      />
                    </div>
                  )}

                  {activeChannel === "cm29" && (
                    <div className="form-group mt-3" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                      <label htmlFor="split-threshold-select" style={{ color: "#a78bfa", fontWeight: "600" }}>29CM 분할 기준 설정</label>
                      <select 
                        id="split-threshold-select" 
                        className="form-control"
                        value={splitThreshold29cm}
                        onChange={(e) => setSplitThreshold29cm(Number(e.target.value))}
                        style={{ marginTop: "8px" }}
                      >
                        <option value={8000}>실제 규격 (8,000px 초과 시 분할)</option>
                        <option value={1500}>테스트/시연용 (1,500px 초과 시 분할)</option>
                      </select>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginTop: "6px" }}>
                        시연 시 일반 크기 이미지로도 자동 분할 동작을 확인하려면 '테스트/시연용'을 선택하세요.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Canvas Previews */}
              <div className="preview-panel">
                <div className="channel-tabs" role="tablist">
                  {Object.entries(CHANNELS).map(([key, value]) => (
                    <button 
                      key={key}
                      className={`tab-btn ${activeChannel === key ? "active" : ""}`}
                      onClick={() => setActiveChannel(key)}
                    >
                      {value.name}
                    </button>
                  ))}
                </div>

                <div className="channel-info-banner">
                  <span className="info-label">규격 기준:</span> {CHANNELS[activeChannel].info}
                </div>

                <div className="preview-workspace">
                  {/* Left: Thumbnail Column */}
                  <div className="preview-column">
                    <div className="column-header">
                      <h4>대표 썸네일 (1:1 정방형)</h4>
                      <span className="size-indicator">
                        {CHANNELS[activeChannel].thumbSize} x {CHANNELS[activeChannel].thumbSize} px
                      </span>
                    </div>
                    <div className="canvas-container">
                      <canvas 
                        ref={thumbnailCanvasRef} 
                        style={{ display: uploadedImages.length > 0 ? "block" : "none" }}
                      />
                      {uploadedImages.length === 0 && (
                        <div className="canvas-placeholder">
                          <Upload size={48} />
                          <p>사진을 업로드하면 썸네일이 실시간 생성됩니다.</p>
                        </div>
                      )}
                    </div>
                    <button 
                      className="btn btn-secondary btn-block mt-3" 
                      onClick={downloadThumbnail}
                      disabled={uploadedImages.length === 0}
                    >
                      <Download size={18} />
                      썸네일만 다운로드
                    </button>
                  </div>

                  {/* Right: Detailed Page Column */}
                  <div className="preview-column">
                    <div className="column-header">
                      <h4>상세페이지 전체 레이아웃</h4>
                      <span className="size-indicator">
                        가로 {CHANNELS[activeChannel].width}px
                      </span>
                    </div>
                    <div className="canvas-container detail-container">
                      <div className="detail-scroll-area">
                        {uploadedImages.length > 0 && sliceGuides.length > 0 && (
                          <div className="slice-guides-container">
                            {sliceGuides.map((guide, idx) => (
                              <div 
                                key={idx} 
                                className="slice-line" 
                                style={{ top: `${guide.y}px` }}
                                data-label={guide.label}
                              />
                            ))}
                          </div>
                        )}
                        <canvas 
                          ref={detailCanvasRef} 
                          style={{ display: uploadedImages.length > 0 ? "block" : "none" }}
                        />
                        {uploadedImages.length === 0 && (
                          <div className="canvas-placeholder">
                            <Upload size={48} />
                            <p>사진을 업로드하면 완성된 상세페이지 템플릿이 합성되어 렌더링됩니다.</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      className="btn btn-secondary btn-block mt-3" 
                      onClick={downloadDetail}
                      disabled={uploadedImages.length === 0}
                    >
                      <Download size={18} />
                      상세페이지 다운로드
                    </button>
                  </div>
                </div>

                {/* ZIP Actions */}
                <div className="download-all-area">
                  <div className="download-all-info">
                    <h4>선택한 옵션으로 일괄 내보내기 준비 완료</h4>
                    <p>브랜드 'immm'의 모든 에셋이 병합되어 다운로드 폴더에 zip으로 압축 저장됩니다.</p>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={downloadAllChannelsZip}
                    disabled={uploadedImages.length === 0 || isZipGenerating}
                  >
                    <Download size={20} />
                    {isZipGenerating ? "ZIP 패키지 생성 중..." : "6대 채널용 리소스 ZIP 다운로드"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="features-detail">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">스마트 디자이너가 가방 브랜드 대표님께 전하는 주요 기능</h2>
              <p className="section-subtitle">디자인 감도 높은 가방 템플릿 레이아웃과 채널 가이드를 완전 분석 탑재했습니다.</p>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <Upload size={24} />
                </div>
                <h3>스마트 1:1 정방형 썸네일</h3>
                <p>무신사의 1500px, 29CM/쿠팡의 1000px 정방형 가이드를 만족시킵니다. 이미지가 잘리지 않도록 영리한 패딩 처리와 정렬 배치 방식을 선택적으로 처리합니다.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <Settings size={24} />
                </div>
                <h3>29CM 규격 8000px 자동 분할</h3>
                <p>세로가 너무 긴 이미지를 강제로 올렸을 때 나타나는 화질 저하 및 업로드 거부 현상을 예방합니다. 8,000px가 넘어가면 픽셀 단위로 매끄럽게 잘라 별도 파트로 다운로드 가능하게 합니다.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <CheckCircle2 size={24} />
                </div>
                <h3>브랜드 자산 클릭 복원</h3>
                <p>매번 가방 소개 상세페이지에 들어가야 하는 브랜드 로고, 소재 상세 사양 정보(가로/세로/두께/무게), 정품 보증 관련 안내를 라이브러리로 관리하여 자동 합성합니다.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <ArrowRight size={24} />
                </div>
                <h3>모바일 한 손 조작 빌드</h3>
                <p>사무실 밖이나 카페, 지하철에서도 손쉽게 스마트폰 사진 앨범에서 제품 컷을 꺼내 상세페이지를 내보낼 수 있도록 가벼운 터치 중심 모바일 UI로 설계되었습니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="pricing-section" id="pricing">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">합리적인 비용으로 시작하세요</h2>
              <p className="section-subtitle">브랜드의 성장 단계에 따라 가장 최적화된 플랜을 추천합니다.</p>
            </div>
            
            <div className="pricing-grid">
              <div className="pricing-card">
                <div className="plan-name">Starter</div>
                <div className="plan-price">무료</div>
                <p className="plan-desc">솔루션을 가볍게 테스트해보고 싶은 1인 창업 대표님을 위한 체험용 등급</p>
                <hr />
                <ul className="plan-features">
                  <li>월 최대 30회 내보내기</li>
                  <li>5대 판매 채널 규격 지원</li>
                  <li>기본 가방 안내 레이아웃 템플릿</li>
                  <li>정방형 썸네일 생성기</li>
                </ul>
                <a href="#playground" className="btn btn-secondary btn-block">무료로 시작하기</a>
              </div>

              <div className="pricing-card premium animate-glow">
                <div className="plan-badge">BEST VALUE</div>
                <div className="plan-name">Pro</div>
                <div className="plan-price">₩19,000 <span>/ 월</span></div>
                <p className="plan-desc">브랜드를 본격적으로 런칭하고 멀티 유통망을 관리하시는 가방 디자이너용 플랜</p>
                <hr />
                <ul className="plan-features">
                  <li>무제한 이미지 내보내기</li>
                  <li><strong>ZIP 파일 일괄 압축 패키지 내보내기</strong></li>
                  <li><strong>29CM 스마트 8,000px 자동 분할</strong></li>
                  <li>브랜드 자산 프리셋 무제한 저장</li>
                  <li>워터마크 없는 깨끗한 출력물</li>
                </ul>
                <a href="#playground" className="btn btn-primary btn-block">무제한 이용하기</a>
              </div>

              <div className="pricing-card">
                <div className="plan-name">Enterprise</div>
                <div className="plan-price">₩59,000 <span>/ 월</span></div>
                <p className="plan-desc">여러 가방 브랜드를 위탁 대행하거나 에이전시 소속 디자이너 그룹을 위한 플랜</p>
                <hr />
                <ul className="plan-features">
                  <li>Pro의 모든 기능 포함</li>
                  <li>멀티 브랜드 정보 설정 (최대 10개)</li>
                  <li>전용 템플릿 커스텀 폰트 기능</li>
                  <li>고객사별 상세페이지 스타일 관리</li>
                  <li>우선순위 프리미엄 고객지원</li>
                </ul>
                <a href="#playground" className="btn btn-secondary btn-block">문의하기</a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section" id="faq">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">자주 묻는 질문</h2>
              <p className="section-subtitle">immm 상세페이지 빌더 서비스에 관해 궁금한 점들을 정리했습니다.</p>
            </div>
            
            <div className="faq-grid">
              <div className="faq-item">
                <h4 className="faq-question">Q. 이미지 크기를 조절할 때 화질이 많이 저하되지는 않나요?</h4>
                <p className="faq-answer">화질을 최대한 보존할 수 있도록 Canvas 스무딩 옵션을 적용하고 최적의 크기로 가공합니다. 업로드하신 원본 해상도가 높을수록 더 깨끗한 결과물을 얻을 수 있습니다.</p>
              </div>
              <div className="faq-item">
                <h4 className="faq-question">Q. 29CM의 세로 8,000px 이상 분할 기능은 정확히 어떻게 조절되나요?</h4>
                <p className="faq-answer">29CM의 경우, 단일 이미지의 세로가 8,000px가 넘어가면 8,000px 단위의 정밀 슬라이싱 작업을 자동으로 수행합니다. 마지막 슬라이스는 남은 잔여 세로 길이만큼 유연하게 처리되므로, 겹치는 경계선 없이 자연스러운 연결감을 선사합니다.</p>
              </div>
              <div className="faq-item">
                <h4 className="faq-question">Q. 모바일 스마트폰에서도 바로 이용할 수 있나요?</h4>
                <p className="faq-answer">네! PC뿐만 아니라 모바일 브라우저의 정방형 파일 업로드 및 로컬 렌더링에 완벽 대응합니다. 이동 중에 모바일 기기로 이미지를 올려 상세페이지를 ZIP 파일로 다운받아 즉시 채널 어드민에 등록할 수 있어 업무 기동성이 극대화됩니다.</p>
              </div>
              <div className="faq-item">
                <h4 className="faq-question">Q. 외부 서버로 제 소중한 사진이 업로드되는 건가요?</h4>
                <p className="faq-answer">아닙니다. immm Detail Studio의 모든 이미지 연산과 워터마크 합성은 사용자의 브라우저 내(로컬 디바이스)에서 전적으로 수행됩니다. 따라서 귀중한 가방 디자인 에셋의 외부 유출이나 보안 걱정 없이 안전하게 고화질 처리를 끝낼 수 있습니다.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-container">
          <div className="footer-brand">
            <a href="#" className="logo">
              <span className="logo-accent">immm</span>
              <span className="logo-text">Detail Studio</span>
            </a>
            <p>1인 가방 디자이너 및 창업가들의 번거로운 상세페이지 가이드 작업을 1초 만에 최적화하여 스마트한 유통 파이프라인을 지원합니다.</p>
          </div>
          <div className="footer-links-group">
            <div className="footer-links">
              <h5>서비스</h5>
              <a href="#features">주요 기능</a>
              <a href="#playground">플레이그라운드</a>
              <a href="#pricing">요금제</a>
            </div>
            <div className="footer-links">
              <h5>회사</h5>
              <a href="#">이용약관</a>
              <a href="#">개인정보처리방침</a>
              <a href="#">고객지원</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 immm Detail Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
