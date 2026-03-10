'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SimulationState, SchedulingStrategy, ProblemScale } from './types';
import { SimulationEngine, ProblemScales, getSimulationEngine } from './core/simulation';
import {
  MapCanvas,
  VehiclePanel,
  TaskPanel,
  ChargingStationPanel,
  ControlPanel,
  StatisticsPanel
} from './components';
import { AchievementPanel, ComboCounter, ProgressRing } from './components/GameElements';
import { LoginModal, UserProfile, useAuth } from './components/LoginModal';
import { LeaderboardPanel, MiniLeaderboard } from './components/Leaderboard';
import { getAuthService } from './services/auth';

export default function Home() {
  const engineRef = useRef<SimulationEngine | null>(null);
  const [state, setState] = useState<SimulationState | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'tasks' | 'stations'>('vehicles');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 连击计数
  const [combo, setCombo] = useState(0);
  const [lastDeliveryTime, setLastDeliveryTime] = useState(0);
  const prevCompletedRef = useRef(0);

  // 登录状态
  const { user, login, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // 游戏结束时提交成绩
  const gameEndSubmittedRef = useRef(false);

  // 初始化模拟引擎
  useEffect(() => {
    const engine = getSimulationEngine();
    engineRef.current = engine;

    // 设置状态变化回调
    engine.setOnStateChange((newState) => {
      setState({ ...newState });
    });

    // 初始化默认配置
    engine.initialize({
      scale: ProblemScales[1], // 中等规模
      strategy: 'nearest_first',
      simulationSpeed: 1,
      maxSimulationTime: 480,
      enableCollaboration: false
    });

    setIsInitialized(true);

    return () => {
      engine.stop();
    };
  }, []);

  // 连击检测
  useEffect(() => {
    if (state && state.statistics.completedTasks > prevCompletedRef.current) {
      const timeDiff = Date.now() - lastDeliveryTime;
      if (timeDiff < 5000) { // 5秒内完成多个任务
        setCombo(prev => prev + 1);
      } else {
        setCombo(1);
      }
      setLastDeliveryTime(Date.now());
      prevCompletedRef.current = state.statistics.completedTasks;
    }
  }, [state?.statistics.completedTasks, lastDeliveryTime, state]);

  // 游戏结束时提交成绩
  useEffect(() => {
    if (state?.status === 'completed' && user && state.statistics.completedTasks > 0 && !gameEndSubmittedRef.current) {
      gameEndSubmittedRef.current = true;
      const authService = getAuthService();
      authService.submitGameRecord({
        oderId: user.id,
        score: state.statistics.totalScore,
        completedTasks: state.statistics.completedTasks,
        failedTasks: state.statistics.failedTasks,
        onTimeRate: state.statistics.onTimeRate,
        totalDistance: state.statistics.totalDistance,
        strategy: state.config.strategy,
        scale: state.config.scale.name,
        duration: state.currentTime
      });
    }
    // 重置游戏时清除提交标记
    if (state?.status === 'idle') {
      gameEndSubmittedRef.current = false;
    }
  }, [state?.status, user, state?.statistics, state?.config, state?.currentTime]);

  // 控制函数
  const handleStart = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const handleReset = useCallback(() => {
    engineRef.current?.reset();
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    engineRef.current?.setSpeed(speed);
  }, []);

  const handleStrategyChange = useCallback((strategy: SchedulingStrategy) => {
    engineRef.current?.setStrategy(strategy);
  }, []);

  const handleScaleChange = useCallback((scale: ProblemScale) => {
    const engine = engineRef.current;
    if (engine) {
      engine.initialize({
        ...engine.getState().config,
        scale
      });
    }
  }, []);

  const handleCollaborationChange = useCallback((enabled: boolean) => {
    engineRef.current?.setCollaboration(enabled);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    // 可以在这里添加点击节点的交互，比如手动创建任务
    console.log('Node clicked:', nodeId);
  }, []);

  // 加载状态
  if (!isInitialized || !state) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white particle-bg">
      {/* 连击显示 */}
      <ComboCounter combo={combo} lastDeliveryTime={lastDeliveryTime} />
      
      {/* 顶部导航栏 */}
      <header className="bg-gray-900/90 backdrop-blur border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
              🔋 新能源物流车队协同调度系统
            </h1>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-full text-xs text-blue-300 animate-borderGradient">
              v1.0.0
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* 快速统计 */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700">
              <ProgressRing progress={state.statistics.onTimeRate} size={28} strokeWidth={3} color="#10B981">
                <span className="text-[8px] text-green-400">{state.statistics.onTimeRate.toFixed(0)}%</span>
              </ProgressRing>
              <span className="text-xs text-gray-400">准时率</span>
            </div>
            
            {/* 排行榜按钮 */}
            <button
              onClick={() => setShowLeaderboard(true)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
            >
              🏆 排行榜
            </button>
            
            <Link
              href="/compare"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
            >
              📊 策略对比
            </Link>
            
            {/* 用户信息 */}
            <UserProfile 
              user={user} 
              onLoginClick={() => setShowLoginModal(true)}
              onLogout={logout}
            />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="p-4">
        <div className="flex gap-4">
          {/* 左侧面板 - 控制和统计 */}
          <div className="w-80 shrink-0 space-y-4">
            <ControlPanel
              config={state.config}
              status={state.status}
              onStart={handleStart}
              onPause={handlePause}
              onStop={handleStop}
              onReset={handleReset}
              onSpeedChange={handleSpeedChange}
              onStrategyChange={handleStrategyChange}
              onScaleChange={handleScaleChange}
              onCollaborationChange={handleCollaborationChange}
            />
            <StatisticsPanel
              statistics={state.statistics}
              events={state.eventLog}
              currentTime={state.currentTime}
              maxTime={state.config.maxSimulationTime}
            />
          </div>

          {/* 中间 - 地图 */}
          <div className="flex-1">
            <MapCanvas
              state={state}
              width={800}
              height={600}
              onNodeClick={handleNodeClick}
              selectedVehicleId={selectedVehicleId}
            />
            
            {/* 快速信息条 */}
            <div className="mt-4 grid grid-cols-5 gap-3">
              <div className="bg-gray-900/80 rounded-lg p-3 border border-gray-700 stat-shine">
                <div className="text-xs text-gray-500 mb-1">🚚 车辆数</div>
                <div className="text-xl font-bold text-white">{state.vehicles.length}</div>
                <div className="text-[10px] text-gray-600 mt-1">
                  运行中: {state.vehicles.filter(v => v.status === 'delivering').length}
                </div>
              </div>
              <div className="bg-gray-900/80 rounded-lg p-3 border border-yellow-700/50 stat-shine">
                <div className="text-xs text-gray-500 mb-1">📦 待处理</div>
                <div className="text-xl font-bold text-yellow-400">{state.statistics.pendingTasks}</div>
                <div className="text-[10px] text-gray-600 mt-1">
                  进行中: {state.tasks.filter(t => t.status === 'in_progress').length}
                </div>
              </div>
              <div className="bg-gray-900/80 rounded-lg p-3 border border-green-700/50 stat-shine">
                <div className="text-xs text-gray-500 mb-1">✅ 已完成</div>
                <div className="text-xl font-bold text-green-400 animate-countUp">{state.statistics.completedTasks}</div>
                <div className="text-[10px] text-gray-600 mt-1">
                  失败: <span className="text-red-400">{state.statistics.failedTasks}</span>
                </div>
              </div>
              <div className="bg-gray-900/80 rounded-lg p-3 border border-orange-700/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-yellow-500/5"></div>
                <div className="relative">
                  <div className="text-xs text-gray-500 mb-1">💰 总收益</div>
                  <div className="text-xl font-bold text-orange-400">{state.statistics.totalScore.toFixed(0)}</div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    效率: {state.statistics.completedTasks > 0 ? (state.statistics.totalScore / state.statistics.completedTasks).toFixed(1) : '--'}/单
                  </div>
                </div>
              </div>
              <div className="bg-gray-900/80 rounded-lg p-3 border border-blue-700/50">
                <div className="text-xs text-gray-500 mb-1">⏱️ 运行时间</div>
                <div className="text-xl font-bold text-blue-400">
                  {Math.floor(state.currentTime / 60)}:{(state.currentTime % 60).toFixed(0).padStart(2, '0')}
                </div>
                <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${(state.currentTime / state.config.maxSimulationTime) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 右侧面板 - 车辆/任务/充电站 */}
          <div className="w-96 shrink-0">
            {/* 标签切换 */}
            <div className="flex gap-1 mb-3 bg-gray-900 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('vehicles')}
                className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                  activeTab === 'vehicles'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                🚚 车队 ({state.vehicles.length})
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                  activeTab === 'tasks'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                📦 任务 ({state.tasks.length})
              </button>
              <button
                onClick={() => setActiveTab('stations')}
                className={`flex-1 py-2 px-3 text-sm rounded-md transition-colors ${
                  activeTab === 'stations'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                ⚡ 充电站 ({state.chargingStations.length})
              </button>
            </div>

            {/* 面板内容 */}
            {activeTab === 'vehicles' && (
              <VehiclePanel
                vehicles={state.vehicles}
                selectedVehicleId={selectedVehicleId}
                onSelectVehicle={setSelectedVehicleId}
              />
            )}
            {activeTab === 'tasks' && (
              <TaskPanel
                tasks={state.tasks}
                currentTime={state.currentTime}
              />
            )}
            {activeTab === 'stations' && (
              <ChargingStationPanel
                stations={state.chargingStations}
                vehicles={state.vehicles}
              />
            )}

            {/* 成就系统 */}
            <div className="mt-4">
              <AchievementPanel statistics={state.statistics} />
            </div>
          </div>
        </div>
      </main>

      {/* 底部信息栏 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-800 px-6 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              系统运行中
            </span>
            <span>|</span>
            <span>数据结构课程大作业</span>
            <span>|</span>
            <span className="text-blue-400">新能源物流车队协同调度</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Dijkstra</span>
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">A*</span>
            <span>调度策略: 6种</span>
            <span>|</span>
            <span>问题规模: 4种</span>
          </div>
        </div>
      </footer>

      {/* 登录模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={login}
      />

      {/* 排行榜模态框 */}
      {showLeaderboard && (
        <LeaderboardPanel
          currentUserId={user?.id}
          onClose={() => setShowLeaderboard(false)}
          isModal={true}
        />
      )}
    </div>
  );
}
