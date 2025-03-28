<template>
  <div class="temperature-chart">
    <h3>{{ title }}</h3>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import type { PropType } from 'vue';
import Chart from 'chart.js/auto';
import type { ChartConfiguration, ChartItem } from 'chart.js';

export default defineComponent({
  name: 'TemperatureChart',
  props: {
    maxTempData: {
      type: Array as PropType<number[]>,
      required: true
    },
    minTempData: {
      type: Array as PropType<number[]>,
      required: true
    },
    timeLabels: {
      type: Array as PropType<string[]>,
      required: true
    },
    title: {
      type: String,
      default: 'Temperature'
    },
    temperatureUnit: {
      type: String,
      default: '°C'
    }
  },
  setup(props) {
    // Use composition API to avoid type issues with the options API
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chartInstance: Chart | null = null;

    const createChart = () => {
      if (!chartCanvas.value) return;

      const ctx = chartCanvas.value.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (chartInstance) {
        chartInstance.destroy();
      }

      const chartConfig: ChartConfiguration = {
        type: 'line',
        data: {
          labels: props.timeLabels,
          datasets: [
            {
              label: `High Temperature (${props.temperatureUnit})`,
              data: props.maxTempData,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
              tension: 0.4
            },
            {
              label: `Low Temperature (${props.temperatureUnit})`,
              data: props.minTempData,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              title: {
                display: true,
                text: `Temperature (${props.temperatureUnit})`
              }
            },
            x: {
              title: {
                display: true,
                text: 'Time'
              }
            }
          }
        }
      };

      // Create new chart with proper typing
      chartInstance = new Chart(ctx as ChartItem, chartConfig);
    };

    const updateChart = () => {
      if (!chartInstance) {
        createChart();
        return;
      }

      // Update chart data
      chartInstance.data.labels = props.timeLabels;
      
      // Update max temperature dataset
      if (chartInstance.data.datasets[0]) {
        chartInstance.data.datasets[0].data = props.maxTempData;
        chartInstance.data.datasets[0].label = `High Temperature (${props.temperatureUnit})`;
      }
      
      // Update min temperature dataset
      if (chartInstance.data.datasets[1]) {
        chartInstance.data.datasets[1].data = props.minTempData;
        chartInstance.data.datasets[1].label = `Low Temperature (${props.temperatureUnit})`;
      }

      // Update chart
      chartInstance.update();
    };

    // Watch for changes in data
    watch(() => props.maxTempData, updateChart, { deep: true });
    watch(() => props.minTempData, updateChart, { deep: true });
    watch(() => props.timeLabels, updateChart, { deep: true });
    watch(() => props.temperatureUnit, updateChart);

    // Create chart on mount
    onMounted(() => {
      createChart();
    });

    // Cleanup on unmount
    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    });

    return {
      chartCanvas
    };
  }
});
</script>

<style scoped>
.temperature-chart {
  width: 100%;
  margin-bottom: 20px;
}

.chart-container {
  position: relative;
  height: 300px;
}

h3 {
  text-align: center;
  margin-bottom: 10px;
}
</style>