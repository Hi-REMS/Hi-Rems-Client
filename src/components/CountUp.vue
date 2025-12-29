<template>
  <span>{{ displayValue }}</span>
</template>

<script>
export default {
  name: "CountUp",
  props: {
    // 목표 숫자 (필수)
    endVal: {
      type: [Number, String],
      required: true,
    },
    // 애니메이션 지속 시간 (ms)
    duration: {
      type: Number,
      default: 2000,
    },
    // 소수점 자릿수 (옵션)
    decimals: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      currentVal: 0,
      animationFrame: null,
    };
  },
  computed: {
    displayValue() {
      // 숫자가 아니면 그대로 표시 (예: '-')
      if (this.currentVal === null || isNaN(Number(this.currentVal))) {
        return "—";
      }
      // 숫자 포맷팅 (콤마 추가)
      return Number(this.currentVal).toLocaleString(undefined, {
        minimumFractionDigits: this.decimals,
        maximumFractionDigits: this.decimals,
      });
    },
  },
  watch: {
    // 목표값이 바뀌면 애니메이션 다시 시작
    endVal: {
      immediate: true,
      handler(newVal) {
        this.animate(newVal);
      },
    },
  },
  methods: {
    animate(target) {
      // 기존 애니메이션 취소
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

      const end = Number(target);
      if (isNaN(end)) {
        this.currentVal = target;
        return;
      }

      const start = this.currentVal;
      const startTime = performance.now();
      const duration = this.duration;

      const frame = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);

        // Easing 함수 (EaseOutExpo): 처음엔 빠르고 끝에 부드럽게 멈춤
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

        this.currentVal = start + (end - start) * ease;

        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(frame);
        } else {
          this.currentVal = end; // 정확한 최종값 보정
        }
      };

      this.animationFrame = requestAnimationFrame(frame);
    },
  },
  beforeDestroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  },
};
</script>
