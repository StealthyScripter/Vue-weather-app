<template>
  <div class="precipitation-chart">
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
  name: 'PrecipitationChart',
  props: {
    chartData: {
      type: Array as PropType<number[]>,
      required: true
    },
    timeLabels: {
      type: Array as PropType<string[]>,
      required: true
    },
    title: {
      type: String,
      default: 'Precipitation'
    },
    timeUnit: {
      type: String,
      default: 'hourly',
      validator: (value: string) => ['hourly', 'daily', 'weekly'].includes(value)
    },
    chartType: {
      type: String,
      default: 'bar',
      validator: (value: string) => ['bar', 'line'].includes(value)
    }
  },
  setup(props) {
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chartInstance: Chart | null = null;

    const getXAxisTitle = (): string => {
      switch (props.timeUnit) {
        case 'hourly':
          return 'Hours';
        case 'daily':
          return 'Days';
        case 'weekly':
          return 'Weeks';
        default:
          return 'Time';
      }
    };

    const currentChartType = ref<'bar' | 'line'>(props.chartType as 'bar' | 'line');

    const createChart = () => {
      if (!chartCanvas.value) return;

      const ctx = chartCanvas.value.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (chartInstance) {
        chartInstance.destroy();
      }

      const chartType = (props.chartType === 'bar' || props.chartType === 'line')
      ? props.chartType
      : 'bar';

      currentChartType.value=chartType;

      const chartConfig: ChartConfiguration = {
        type: chartType,
        data: {
          labels: props.timeLabels,
          datasets: [{
            label: 'Precipitation (mm)',
            data: props.chartData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Precipitation (mm)'
              }
            },
            x: {
              title: {
                display: true,
                text: getXAxisTitle()
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

      // Check if chart type changed or is invalid
      if (props.chartType !== 'bar' && props.chartType !== 'line') {
        console.warn(`Invalid chart type: ${props.chartType}. Using 'bar' instead.`);
        // Only recreate if current type is not already 'bar'
        if (currentChartType.value !== 'bar') {
          chartInstance.destroy();
          createChart();
          return;
        }
      } else if (currentChartType.value !== props.chartType) {
        // Chart type changed to a valid type
        chartInstance.destroy();
        createChart();
        return;
      }

      // If we didn't need to recreate the chart, just update the data
      chartInstance.data.labels = props.timeLabels;
      if (chartInstance.data.datasets[0]) {
        chartInstance.data.datasets[0].data = props.chartData;
      }

      // Update chart options
      if (chartInstance.options && chartInstance.options.scales &&
          'x' in chartInstance.options.scales && chartInstance.options.scales.x &&
          'title' in chartInstance.options.scales.x && chartInstance.options.scales.x.title) {
        chartInstance.options.scales.x.title.text = getXAxisTitle();
      }
      
      // Update chart
      chartInstance.update();
    };

    // Watch for changes in data and props
    watch(() => props.chartData, updateChart, { deep: true });
    watch(() => props.timeLabels, updateChart, { deep: true });
    watch(() => props.timeUnit, updateChart);
    watch(() => props.chartType, updateChart);

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
.precipitation-chart {
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
