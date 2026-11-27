/**
 * 录音工具：在 `recorder.ts`（WAV 采集）之上提供「开始/停止/回放/清理」的简单封装，
 * 并统一处理权限与设备错误。
 */

/** `Recorder.get()` 的回调参数：成功拿到实例，或拿到错误信息 */
export type RecorderResult = Recorder | { error: string };

/** 录音回调参数 */
export interface RecordCallback {
  success: (value: Blob | string) => void;
  error: (message: string) => void;
}

/** 采集参数 */
export interface RecorderOptions {
  /** 输出采样数位，默认 16 */
  sampleBits?: number;
  /** 输出采样率，默认 8000 */
  sampleRate?: number;
}

/** WAV 采集缓冲（内部结构） */
export interface AudioDataBuffer {
  size: number;
  buffer: Float32Array[];
  inputSampleRate: number;
  inputSampleBits: number;
  outputSampleRate: number;
  oututSampleBits: number;
  input(data: Float32Array): void;
  compress(): Float32Array;
  encodeWAV(): Blob;
}

/** `window.webkitAudioContext` 等前缀属性在 TS 标准库里没有 */
type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

/** 旧版回调式 getUserMedia（TS 标准库签名不同，这里单独收窄） */
type LegacyGetUserMedia = (constraints: MediaStreamConstraints) => Promise<MediaStream>;

export default class Recorder {
  /** 音频上下文 */
  context: AudioContext;

  /** 音频输入源 */
  audioInput: MediaStreamAudioSourceNode;

  /** 采集节点 */
  recorder: ScriptProcessorNode;

  /** 录音数据 */
  audioData: AudioDataBuffer;

  constructor(stream: MediaStream, config: RecorderOptions = {}) {
    // 兼容（window.URL 在旧浏览器可能缺失）
    const win = window as AudioWindow & { URL?: typeof URL };
    win.URL = win.URL || window.URL;

    const sampleBits = config.sampleBits ?? 16; // 采样数位 8, 16
    const sampleRate = config.sampleRate ?? 8000; // 采样率

    const AudioCtor = win.webkitAudioContext || window.AudioContext;
    this.context = new AudioCtor();
    this.audioInput = this.context.createMediaStreamSource(stream);
    this.recorder = this.context.createScriptProcessor(4096, 1, 1);

    this.audioData = {
      size: 0, // 录音文件长度
      buffer: [], // 录音缓存
      inputSampleRate: this.context.sampleRate, // 输入采样率
      inputSampleBits: 16, // 输入采样数位 8, 16
      outputSampleRate: sampleRate, // 输出采样率
      oututSampleBits: sampleBits, // 输出采样数位 8, 16
      input(data: Float32Array) {
        this.buffer.push(new Float32Array(data));
        this.size += data.length;
      },
      compress() {
        // 合并
        const data = new Float32Array(this.size);
        let offset = 0;
        for (let i = 0; i < this.buffer.length; i++) {
          data.set(this.buffer[i], offset);
          offset += this.buffer[i].length;
        }
        // 压缩
        const compression = parseInt(String(this.inputSampleRate / this.outputSampleRate), 10);
        const length = data.length / compression;
        const result = new Float32Array(length);
        let index = 0;
        let j = 0;
        while (index < length) {
          result[index] = data[j];
          j += compression;
          index++;
        }
        return result;
      },
      encodeWAV() {
        const sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
        const sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
        const bytes = this.compress();
        const dataLength = bytes.length * (sampleBits / 8);
        const buffer = new ArrayBuffer(44 + dataLength);
        const data = new DataView(buffer);

        const channelCount = 1; // 单声道
        let offset = 0;

        const writeString = (str: string) => {
          for (let i = 0; i < str.length; i++) {
            data.setUint8(offset + i, str.charCodeAt(i));
          }
        };

        // 资源交换文件标识符
        writeString("RIFF");
        offset += 4;
        // 下个地址开始到文件尾总字节数，即文件大小 - 8
        data.setUint32(offset, 36 + dataLength, true);
        offset += 4;
        // WAV 文件标志
        writeString("WAVE");
        offset += 4;
        // 波形格式标志
        writeString("fmt ");
        offset += 4;
        // 过滤字节，一般为 0x10 = 16
        data.setUint32(offset, 16, true);
        offset += 4;
        // 格式类别（PCM 形式采样数据）
        data.setUint16(offset, 1, true);
        offset += 2;
        // 通道数
        data.setUint16(offset, channelCount, true);
        offset += 2;
        // 采样率
        data.setUint32(offset, sampleRate, true);
        offset += 4;
        // 波形数据传输率
        data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
        offset += 4;
        // 块数据调整数
        data.setUint16(offset, channelCount * (sampleBits / 8), true);
        offset += 2;
        // 每样本数据位数
        data.setUint16(offset, sampleBits, true);
        offset += 2;
        // 数据标识符
        writeString("data");
        offset += 4;
        // 采样数据总数
        data.setUint32(offset, dataLength, true);
        offset += 4;

        // 写入采样数据
        if (sampleBits === 8) {
          for (let i = 0; i < bytes.length; i++, offset++) {
            const s = Math.max(-1, Math.min(1, bytes[i]));
            let val = s < 0 ? s * 0x8000 : s * 0x7fff;
            val = parseInt(String(255 / (65535 / (val + 32768))), 10);
            data.setInt8(offset, val);
          }
        } else {
          for (let i = 0; i < bytes.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, bytes[i]));
            data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
          }
        }
        return new Blob([data], {
          type: "audio/wav",
        });
      },
    };
  }

  /** 开始录音 */
  start(): void {
    this.audioInput.connect(this.recorder);
    this.recorder.connect(this.context.destination);

    // 音频采集
    this.recorder.onaudioprocess = (e: AudioProcessingEvent) => {
      this.audioData.input(e.inputBuffer.getChannelData(0));
    };
  }

  /** 停止采集 */
  stop(): void {
    this.recorder.disconnect();
  }

  /** 获取音频文件 */
  getBlob(): Blob {
    this.stop();
    return this.audioData.encodeWAV();
  }

  /** 回放 */
  play(audio: HTMLAudioElement): void {
    audio.src = window.URL.createObjectURL(this.getBlob());
  }

  /** 清理缓存的录音数据 */
  clear(audio: HTMLAudioElement): void {
    this.audioData.buffer = [];
    this.audioData.size = 0;
    audio.src = "";
  }

  /** 把 getUserMedia 的错误翻译成中文提示 */
  static checkError(e: { name?: string }): { error: string } {
    const { name } = e;
    let errorMsg = "";
    switch (name) {
      case "AbortError":
        errorMsg = "录音设备无法被使用";
        break;
      case "NotAllowedError":
        errorMsg = "用户已禁止网页调用录音设备";
        break;
      case "PermissionDeniedError":
        errorMsg = "用户已禁止网页调用录音设备";
        break;
      case "NotFoundError":
        errorMsg = "录音设备未找到";
        break;
      case "DevicesNotFoundError":
        errorMsg = "录音设备未找到";
        break;
      case "NotReadableError":
        errorMsg = "录音设备无法使用";
        break;
      case "NotSupportedError":
        errorMsg = "不支持录音功能";
        break;
      case "MandatoryUnsatisfiedError":
        errorMsg = "无法发现指定的硬件设备";
        break;
      default:
        errorMsg = "录音调用错误";
        break;
    }
    return { error: errorMsg };
  }

  /** 申请录音权限并创建实例 */
  static get(callback: (result: RecorderResult) => void, config?: RecorderOptions): void {
    if (!callback) return;

    const constraints: MediaStreamConstraints = { audio: true, video: false };

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => callback(new Recorder(stream, config)))
        .catch((e: { name?: string }) => callback(Recorder.checkError(e)));
      return;
    }

    // 旧浏览器：回调式 getUserMedia 被包装成 Promise 的写法
    const legacy = navigator as Navigator & { getUserMedia?: LegacyGetUserMedia };
    legacy
      .getUserMedia?.(constraints)
      ?.then((stream) => callback(new Recorder(stream, config)))
      .catch((e: { name?: string }) => callback(Recorder.checkError(e)));
  }
}
