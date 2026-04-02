import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

const CustomBarChart = ({ data }) => {

  const getBarColor = (entry) => {
    switch (entry?.priority) {
      case 'Low':
        return '#4C7F6A';

      case 'Medium':
        return '#2F7A84';

      case 'High':
        return '#D97706';

      default:
        return '#8884d8';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if(active && payload && payload.length) {
      return (
        <div className="">
          <p className="">
            {payload[0].payload.priority}
          </p>
          <p className="">
            Count: {" "}
            <span className="">
              {payload[0].payload.count}
            </span>
          </p>
        </div>
      )
    }
    return null;
  }
  return (
    <div className="">
      <ResponsiveContainer 
    </div>
  )
}

export default CustomBarChart