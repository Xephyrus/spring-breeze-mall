/**
 * store 是纯 JS（vuex createStore），没有完整的类型定义。
 *
 * 这里给出 state 的明确形状，避免 Volar 在 .vue 的 <script lang="ts"> 里
 * 把 `store.state` 推断成不可用的类型；索引签名保证后续新增的字段不会报错。
 *
 * 注意：这是编辑器声明文件，不参与构建。
 */
export interface AppStoreState {
  isShowToast: boolean
  remark: any[]
  shareLink: string
  verificationKey: string
  distributionId: string
  hasLogin: boolean
  userInfo: any
  uuid: string
  token: string
  userName?: string
  theme: {
    mainColor: string
    lightColor: string
    aiderLightColor: string
  }
  categoryPageSetting: any
  [key: string]: any
}

export interface AppStore {
  state: AppStoreState
  getters: {
    mainColor: string
    lightColor: string
    aiderLightColor: string
    [key: string]: any
  }
  commit(type: string, payload?: any, options?: any): void
  dispatch(type: string, payload?: any, options?: any): any
}

export declare function useStore(): AppStore

declare const store: AppStore
export default store
