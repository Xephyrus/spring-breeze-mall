import Recorder, { type RecorderResult } from "./recorder";

/** 录音回调参数 */
export interface RecordSdkCallback {
  success: (value: Blob | string) => void;
  error: (message: string) => void;
}

/** 录音 SDK 包装：把 Recorder 的实例/回调差异收敛成 start/stop/play/clear 四个方法 */
export default class Record {
  recorder: Recorder | null = null;

  startRecord(param: RecordSdkCallback): void {
    try {
      Recorder.get((result: RecorderResult) => {
        if ("error" in result) {
          param.error(result.error);
          return;
        }
        this.recorder = result;
        result.start();
        param.success("开始录音");
      });
    } catch (e) {
      param.error("开始录音失败" + String(e));
    }
  }

  stopRecord(param: RecordSdkCallback): void {
    try {
      if (!this.recorder) {
        param.error("结束录音失败：尚未开始录音");
        return;
      }
      param.success(this.recorder.getBlob());
    } catch (e) {
      param.error("结束录音失败" + String(e));
    }
  }

  play(audio: HTMLAudioElement): void {
    try {
      this.recorder?.play(audio);
    } catch (e) {
      console.error("录音播放失败" + String(e));
    }
  }

  clear(audio: HTMLAudioElement): void {
    try {
      this.recorder?.clear(audio);
    } catch (e) {
      console.error("清空录音失败" + String(e));
    }
  }
}
