"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis } from "recharts";
import React, { SVGProps } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

interface DataPoint {
    label: string;
    value: number;
}

interface MonochromeBarChartProps {
    title: string;
    description?: string;
    data: DataPoint[];
    configLabel: string;
    unit?: string;
}

export function MonochromeBarChart({
    title,
    description,
    data,
    configLabel,
    unit = "",
}: MonochromeBarChartProps) {
    const [activeIndex, setActiveIndex] = React.useState<number | undefined>(
        undefined
    );

    const activeData = React.useMemo(() => {
        if (activeIndex === undefined) return null;
        return data[activeIndex];
    }, [activeIndex, data]);

    const chartConfig = {
        value: {
            label: configLabel,
            color: "var(--secondary-foreground)",
        },
    } satisfies ChartConfig;

    return (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10 shadow-xl overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    <span className="text-xl font-bold text-white tracking-tight">{title}</span>
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(inter.className, "text-2xl font-bold tracking-tighter text-white")}
                        >
                            {activeData ? `${activeData.value}${unit}` : "Select Team"}
                        </span>
                        {activeData && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/20">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                <span>Win Prob</span>
                            </Badge>
                        )}
                    </div>
                </CardTitle>
                {description && <CardDescription className="text-white/60">{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="wait">
                    <ChartContainer config={chartConfig} className="h-[200px]">
                        <BarChart
                            accessibilityLayer
                            data={data}
                            onMouseLeave={() => setActiveIndex(undefined)}
                            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                        >
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3).toUpperCase()}
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                            />
                            <Bar
                                dataKey="value"
                                fill="var(--secondary-foreground)"
                                shape={
                                    <CustomBar
                                        setActiveIndex={setActiveIndex}
                                        activeIndex={activeIndex}
                                    />
                                }
                            ></Bar>
                        </BarChart>
                    </ChartContainer>
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

interface CustomBarProps extends SVGProps<SVGSVGElement> {
    setActiveIndex: (index?: number) => void;
    index?: number;
    activeIndex?: number;
    value?: any;
}

const CustomBar = (props: CustomBarProps) => {
    const { fill, x, y, width, height, index, activeIndex, value } = props;

    // Custom variables
    const xPos = Number(x || 0);
    const realWidth = Number(width || 0);
    const isActive = index === activeIndex;
    const collapsedWidth = 4;
    // centered bar x-position
    const barX = isActive ? xPos : xPos + (realWidth - collapsedWidth) / 2;
    // centered text x-position
    const textX = xPos + realWidth / 2;

    // Custom bar shape
    return (
        <g onMouseEnter={() => props.setActiveIndex(index)}>
            {/* rendering the bar with custom postion and animated width */}
            <motion.rect
                style={{
                    willChange: "transform, width", // helps with performance
                }}
                y={y}
                initial={{ width: collapsedWidth, x: barX }}
                animate={{ width: isActive ? realWidth : collapsedWidth, x: barX }}
                transition={{
                    duration: activeIndex === index ? 0.3 : 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                }}
                height={height}
                fill={fill}
                className="fill-blue-500/80 hover:fill-blue-400 rx-1"
                rx={2}
            />
            {/* Render value text on top of bar */}
            {isActive && (
                <motion.text
                    style={{
                        willChange: "transform, opacity", // helps with performance
                    }}
                    className={inter.className}
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.1 }}
                    x={textX}
                    y={Number(y) - 8}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={14}
                    fontWeight={700}
                >
                    {value}%
                </motion.text>
            )}
        </g>
    );
};
