<script setup>
import { onMounted, ref } from "vue";

const props = defineProps({
  id: String,
  scriptSrc: String,
  options: Object,
});

const container = ref(null);

onMounted(() => {
  if (!container.value) return;

  // Hindari double render
  if (container.value.childNodes.length > 0) return;

  // Inject atOptions
  if (props.options) {
    const optScript = document.createElement("script");
    optScript.type = "text/javascript";
    optScript.innerHTML = `atOptions = ${JSON.stringify(props.options)}`;
    container.value.appendChild(optScript);
  }

  // Inject script utama
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = props.scriptSrc;
  script.async = true;

  container.value.appendChild(script);
});
</script>

<template>
  <div
    :id="id"
    ref="container"
    class="flex justify-center items-center w-full"
  ></div>
</template>
