<template>
  <div class="iframediv">
    <iframe :src="link" ref="ifram" scrolling="auto" id="ifram"></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

defineOptions({ name: "ExternalLink" });

const route = useRoute();

const link = ref(String(route.name ?? ""));

onMounted(() => {
  const iframe = document.getElementById("ifram") as HTMLIFrameElement | null;
  if (!iframe) return;
  const deviceWidth = document.body.clientWidth;
  const deviceHeight = document.body.clientHeight;
  iframe.style.width = `${deviceWidth}px`;
  iframe.style.height = `${deviceHeight}px`;
});
</script>
<style lang="scss" scoped></style>
