<template>
  <div class="map">

    <div class="address">{{ addrContent.address }}</div>
    <div id="map-container"></div>

    <div class="search-con">
      <el-input id="input-map" v-model="mapSearch" placeholder="输入关键字搜索" clearable />
      <ul>
        <li v-for="(tip, index) in tips" :key="index" @click="selectAddr(tip.location)">
          <p>{{ tip.name }}</p>
          <p>{{ (tip.district || "") + (tip.address || "") }}</p>
        </li>
      </ul>
    </div>
    <div class="footer">
      <el-button type="primary" :loading="loading" @click="ok">确定</el-button>
    </div>

  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { getRegion } from "@/api/common";
import config from "@/config/index";
import { ElMessage } from "element-plus";

defineOptions({ name: "RegionMap" });

type AddrContent = {
  address?: string;
  addr?: string;
  addrId?: string | number;
  regeocode?: {
    addressComponent?: {
      citycode?: string;
      township?: string;
    };
  };
  [key: string]: unknown;
};

/** 高德 JSAPI 里本组件真正用到的部分（官方没有 TS 声明，这里按需最小声明） */
type AMapMapInstance = {
  addControl: (control: unknown) => void;
};

type AMapAutocompleteInstance = {
  search: (keyword: string, cb: (status: string, result: AMapSearchResult) => void) => void;
};

type AMapSearchTip = {
  name?: string;
  district?: string;
  address?: string;
  adcode?: string;
  location?: { lng: number; lat: number };
  [key: string]: unknown;
};

type AMapSearchResult = {
  info?: string;
  tips?: AMapSearchTip[];
};

type AMapConstructor = {
  Map: new (container: string, opts: Record<string, unknown>) => AMapMapInstance;
  ToolBar: new () => unknown;
  Autocomplete: new (opts: Record<string, unknown>) => AMapAutocompleteInstance;
  PlaceSearch: new () => unknown;
  Geocoder: new (opts?: Record<string, unknown>) => unknown;
};

declare const AMapUI: {
  PositionPicker: new (opts: Record<string, unknown>) => {
    start: () => void;
    on: (event: string, cb: (result: AddrContent) => void) => void;
  };
};

const emit = defineEmits(["getAddress"]);

const mapSearch = ref(""); // 地图搜索
const map = ref<AMapMapInstance | null>(null); // 初始化地图
const autoComplete = ref<AMapAutocompleteInstance | null>(null); // 初始化搜索方法
const geocoder = ref<unknown>(null); // 初始化地理、坐标转化
/** 拖拽选点：start 可带经纬度或不带，on 订阅选点结果 */
const positionPicker = ref<{
  start: (lnglat?: number[]) => void;
  on: (event: string, cb: (result: AddrContent) => void) => void;
} | null>(null); // 地图拖拽选点
const tips = ref<AMapSearchTip[]>([]); //搜索关键字列表
const addrContent = ref<AddrContent>({}); // 回显地址信息
const loading = ref(false); // 加载状态

watch(mapSearch, (val) => {
  searchOfMap(val);
});

function ok() {

  if (addrContent.value && addrContent.value.regeocode) {
    const params = {
      cityCode: addrContent.value.regeocode.addressComponent!.citycode,
      townName: addrContent.value.regeocode.addressComponent!.township,
    };
    getRegion(params).then((res) => {
      if (res.success && res.result) {
        addrContent.value.addr = (res.result.name ?? "").replace(/,/g, " ");
        addrContent.value.addrId = res.result.id;
        loading.value = false;

        emit("getAddress", addrContent.value);
      }
    });
  } else {
    ElMessage.error('未获取到坐标信息！请查看高德API配置是否正确')
  }

}
function init() {
  AMapLoader.load({
    key: config.aMapKey, // 申请好的Web端开发者Key，首次调用 load 时必填
    version: "", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: [
      "AMap.ToolBar",
      "AMap.Autocomplete",
      "AMap.PlaceSearch",
      "AMap.Geolocation",
      "AMap.Geocoder",
    ], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
    AMapUI: {
      // 是否加载 AMapUI，缺省不加载
      version: "1.1", // AMapUI 缺省 1.1
      plugins: ["misc/PositionPicker"], // 需要加载的 AMapUI ui插件
    },
  })
    .then((AMap: AMapConstructor) => {
      map.value = new AMap.Map("map-container", {
        zoom: 12,
      });
      map.value?.addControl(new AMap.ToolBar());
      map.value?.addControl(new AMap.PlaceSearch());
      map.value?.addControl(new AMap.Geocoder());

      // 实例化Autocomplete
      const autoOptions: Record<string, unknown> = {
        city: "全国",
      };
      autoComplete.value = new AMap.Autocomplete(autoOptions); // 搜索
      geocoder.value = new AMap.Geocoder(autoOptions);

      positionPicker.value = new AMapUI.PositionPicker({
        // 拖拽选点
        mode: "dragMap",
        map: map.value,
      });
      positionPicker.value.start();
      /**
       *
       * 所有回显数据，都在positionResult里面
       * 需要字段可以查找
       *
       */
      positionPicker.value?.on("success", function (positionResult: AddrContent) {
        addrContent.value = positionResult;
      });
    })
    .catch(() => {});
}
function searchOfMap(val: string) {
  // 地图搜索
  autoComplete.value?.search(val, function (status: string, result: AMapSearchResult) {
    // 搜索成功时，result即是对应的匹配数据
    if (status == "complete" && result.info == "OK") {
      tips.value = result.tips ?? [];
    } else {
      tips.value = [];
    }
  });
}
function selectAddr(location?: { lng: number; lat: number }) {
  // 选择坐标
  if (!location) {
    ElMessage.warning("请选择正确点位");
    return false;
  }
  const lnglat = [location.lng, location.lat];
  positionPicker.value?.start(lnglat);
}

onMounted(() => {
  init();
});

// 唯一引用方 multiple-map.vue 通过 ref 引用本组件但从不访问任何成员（仅监听 getAddress 事件），无需暴露成员
</script>
<style lang="scss" scoped>
#map-container {
  width: 500px;
  height: 400px;
}

.search-con {
  position: absolute;
  right: 20px;
  top: 64px;
  width: 260px;

  ul {
    width: 260px;
    height: 360px;
    overflow: scroll;

    li {
      padding: 5px;

      p:nth-child(2) {
        color: #999;
        font-size: 12px;
      }

      &:hover {
        background-color: #eee;
        cursor: pointer;
      }
    }
  }
}

.address {
  margin-bottom: 10px;
  // color: $theme_color;
  font-weight: bold;
}

.footer {
  text-align: right;
  margin: 10px 0;
}
</style>
