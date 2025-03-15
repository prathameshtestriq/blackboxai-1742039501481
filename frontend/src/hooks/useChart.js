import { useMemo, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import useSettings from './useSettings';
import useDateTime from './useDateTime';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const useChart = (options = {}) => {
  const {
    type = 'line',
    width = SCREEN_WIDTH - 32, // Full width minus padding
    height = 220,
    padding = 16,
    showGrid = true,
    showLabels = true,
    showLegend = true,
    animate = true,
  } = options;

  const theme = useTheme();
  const { settings } = useSettings();
  const { formatDate, formatTime } = useDateTime();

  // Default chart styles
  const defaultStyles = useMemo(() => ({
    chart: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      padding,
    },
    grid: {
      stroke: theme.colors.disabled,
      strokeWidth: 0.5,
      opacity: 0.5,
    },
    axis: {
      stroke: theme.colors.text,
      strokeWidth: 1,
    },
    label: {
      color: theme.colors.text,
      fontSize: 12,
    },
    legend: {
      color: theme.colors.text,
      fontSize: 12,
      padding: 8,
    },
  }), [theme, padding]);

  // Format chart data
  const formatData = useCallback((data, config = {}) => {
    const {
      xKey = 'x',
      yKey = 'y',
      dateFormat,
      timeFormat,
    } = config;

    return data.map(item => ({
      x: dateFormat ? formatDate(item[xKey], dateFormat) :
         timeFormat ? formatTime(item[xKey], timeFormat) :
         item[xKey],
      y: typeof item[yKey] === 'number' ? item[yKey] : 0,
      ...item,
    }));
  }, [formatDate, formatTime]);

  // Get chart colors
  const getChartColors = useCallback((count = 1) => {
    const colors = [
      theme.colors.primary,
      theme.colors.accent,
      theme.colors.error,
      theme.colors.success,
      theme.colors.warning,
      theme.colors.info,
    ];

    return count === 1 ? colors[0] : colors.slice(0, count);
  }, [theme]);

  // Line chart configuration
  const getLineChartConfig = useCallback((data, config = {}) => {
    return {
      width,
      height,
      data: formatData(data, config),
      style: defaultStyles.chart,
      animate,
      enableGrid: showGrid,
      enableLabels: showLabels,
      enableLegend: showLegend,
      color: getChartColors(),
      ...config,
    };
  }, [width, height, formatData, defaultStyles, animate, showGrid, showLabels, showLegend, getChartColors]);

  // Bar chart configuration
  const getBarChartConfig = useCallback((data, config = {}) => {
    return {
      width,
      height,
      data: formatData(data, config),
      style: defaultStyles.chart,
      animate,
      enableGrid: showGrid,
      enableLabels: showLabels,
      enableLegend: showLegend,
      colors: getChartColors(data.length),
      ...config,
    };
  }, [width, height, formatData, defaultStyles, animate, showGrid, showLabels, showLegend, getChartColors]);

  // Pie chart configuration
  const getPieChartConfig = useCallback((data, config = {}) => {
    return {
      width,
      height,
      data: formatData(data, config),
      style: defaultStyles.chart,
      animate,
      enableLabels: showLabels,
      enableLegend: showLegend,
      colors: getChartColors(data.length),
      ...config,
    };
  }, [width, height, formatData, defaultStyles, animate, showLabels, showLegend, getChartColors]);

  // Format price chart data
  const formatPriceData = useCallback((prices, config = {}) => {
    const {
      timeframe = '1D',
      interval = '5m',
      dateFormat = 'HH:mm',
    } = config;

    return prices.map(price => ({
      x: formatDate(price.timestamp, dateFormat),
      y: price.value,
      timestamp: price.timestamp,
      change: price.change,
      volume: price.volume,
    }));
  }, [formatDate]);

  // Format performance chart data
  const formatPerformanceData = useCallback((performance, config = {}) => {
    const {
      dateFormat = 'MMM dd',
    } = config;

    return performance.map(item => ({
      x: formatDate(item.date, dateFormat),
      y: item.value,
      date: item.date,
      change: item.change,
    }));
  }, [formatDate]);

  // Get chart dimensions
  const getChartDimensions = useCallback((customWidth, customHeight) => {
    const chartWidth = customWidth || width;
    const chartHeight = customHeight || height;
    const aspectRatio = chartWidth / chartHeight;

    return {
      width: chartWidth,
      height: chartHeight,
      aspectRatio,
      padding,
    };
  }, [width, height, padding]);

  return {
    // Chart configurations
    getLineChartConfig,
    getBarChartConfig,
    getPieChartConfig,

    // Data formatting
    formatData,
    formatPriceData,
    formatPerformanceData,

    // Styling
    defaultStyles,
    getChartColors,
    getChartDimensions,
  };
};

// Example usage with price charts
export const usePriceChart = (prices, options = {}) => {
  const chart = useChart(options);
  const { settings } = useSettings();

  const chartData = useMemo(() => {
    return chart.formatPriceData(prices, {
      timeframe: settings.chartPeriod,
      interval: '5m',
    });
  }, [prices, settings.chartPeriod, chart]);

  const chartConfig = useMemo(() => {
    return chart.getLineChartConfig(chartData, {
      enableCrosshair: true,
      enableTooltip: true,
      curved: true,
      ...options,
    });
  }, [chartData, chart, options]);

  return {
    chartData,
    chartConfig,
  };
};

// Example usage with performance charts
export const usePerformanceChart = (performance, options = {}) => {
  const chart = useChart(options);

  const chartData = useMemo(() => {
    return chart.formatPerformanceData(performance);
  }, [performance, chart]);

  const chartConfig = useMemo(() => {
    return chart.getBarChartConfig(chartData, {
      enableValue: true,
      enablePercent: true,
      ...options,
    });
  }, [chartData, chart, options]);

  return {
    chartData,
    chartConfig,
  };
};

export default useChart;
