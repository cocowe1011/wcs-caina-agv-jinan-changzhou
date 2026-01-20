<template>
  <div class="smart-workshop">
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
      <!-- 左侧面板 -->
      <div class="side-info-panel">
        <!-- PLC状态与订单信息区域 -->
        <div class="plc-info-section">
          <div class="section-header">当前扫码托盘信息</div>
          <div class="scrollable-content" style="margin-top: 5px">
            <div class="status-overview">
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop granient-text">
                    订单id
                  </div>
                  <div
                    class="data-card-border-borderDown"
                    style="font-size: 1.3vw"
                  >
                    {{ nowScanTrayInfo.orderId || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">产品名称</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.productName || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">当前进货口</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.inPut || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">是否消毒</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.isTerile || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">物料编号</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.productCode || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">批次</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.batchNo || '--' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作区 -->
        <div class="operation-panel">
          <div class="section-header">
            <span>操作区</span>
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-search"
              @click="showOrderQueryDialog"
            >
              查询历史订单
            </el-button>
          </div>
          <div class="operation-buttons">
            <button
              @click="toggleButtonState('start')"
              :class="{ pressed: buttonStates.start }"
            >
              <i class="el-icon-switch-button"></i><span>全线启动</span>
            </button>
            <button
              @click="toggleButtonState('stop')"
              :class="{ pressed: buttonStates.stop }"
            >
              <i class="el-icon-error"></i><span>全线停止</span>
            </button>
            <button
              v-show="false"
              @click="toggleButtonState('reset')"
              :class="{ pressed: buttonStates.reset }"
            >
              <i class="el-icon-video-pause"></i><span>全线暂停</span>
            </button>
            <button @click="toggleButtonState('fault_reset')">
              <i class="el-icon-refresh"></i><span>故障复位</span>
            </button>
            <button @click="toggleButtonState('clear')">
              <i class="el-icon-delete"></i><span>全线清空</span>
            </button>
          </div>
        </div>

        <!-- 日志区域 -->
        <div class="log-section">
          <div class="section-header">
            日志区
            <div class="log-tabs">
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'running' }"
                @click="activeLogType = 'running'"
              >
                运行日志
              </div>
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'alarm' }"
                @click="switchToAlarmLog"
              >
                报警日志
                <div v-if="unreadAlarms > 0" class="alarm-badge">
                  {{ unreadAlarms }}
                </div>
              </div>
            </div>
          </div>
          <div class="scrollable-content">
            <div class="log-list">
              <template v-if="currentLogs.length > 0">
                <div
                  v-for="log in currentLogs"
                  :key="log.id"
                  :class="[
                    'log-item',
                    { alarm: log.type === 'alarm', unread: log.unread }
                  ]"
                >
                  <div class="log-time">{{ formatTime(log.timestamp) }}</div>
                  <div class="log-item-content">{{ log.message }}</div>
                </div>
              </template>
              <div v-else class="empty-state">
                <i class="el-icon-chat-line-square"></i>
                <p>
                  {{
                    activeLogType === 'running'
                      ? '暂无运行日志'
                      : '暂无报警日志'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧内容区域 -->
      <div class="main-content">
        <div class="floor-container">
          <!-- 左侧区域 -->
          <div class="floor-left">
            <div class="floor-title">
              <i class="el-icon-office-building"></i> 一楼区域
            </div>
            <div class="floor-image-container">
              <div class="image-wrapper">
                <img
                  src="@/assets/changzhou-img/image.png"
                  alt="一楼平面图"
                  class="floor-image"
                  @load="updateMarkerPositions"
                />
                <!-- 修改队列标识 -->
                <div
                  v-for="marker in queueMarkers.filter((m) => m.id !== 15)"
                  :key="marker.id"
                  class="queue-marker"
                  :data-x="marker.x"
                  :data-y="marker.y"
                  @click="handleQueueMarkerClick(marker.queueId)"
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count" v-if="marker.id === 1">{{
                      queues.find((q) => q.id === marker.queueId)?.trayInfo
                        ?.length || 0
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 2">{{
                      queues.find((q) => q.id === marker.queueId)?.trayInfo
                        ?.length || 0
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 3">{{
                      bufferQuantity
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 4">{{
                      aLineQuantity.a1
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 5">{{
                      bLineQuantity.b1
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 6">{{
                      cLineQuantity.c1
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 7">{{
                      aLineQuantity.a2
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 8">{{
                      bLineQuantity.b2
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 9">{{
                      cLineQuantity.c2
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 10">{{
                      aLineQuantity.a3
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 11">{{
                      bLineQuantity.b3
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 12">{{
                      cLineQuantity.c3
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 13">{{
                      dDisinfectionInQuantity
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 14">{{
                      eDisinfectionInQuantity
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 16">{{
                      dDisinfectionOutQuantity
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 17">{{
                      eDisinfectionOutQuantity
                    }}</span>
                    <span class="queue-marker-name">{{ marker.name }}</span>
                  </div>
                </div>

                <!-- 上货1数量标记 -->
                <div
                  class="queue-marker special-queue"
                  data-x="900"
                  data-y="1350"
                  style="
                    position: absolute;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                  "
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count">
                      {{ upLoad1Quantity }}
                    </span>
                    <span class="queue-marker-name">上货1</span>
                  </div>
                </div>

                <!-- 上货2数量标记 -->
                <div
                  class="queue-marker special-queue"
                  data-x="1700"
                  data-y="1350"
                  style="
                    position: absolute;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                  "
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count">
                      {{ upLoad2Quantity }}
                    </span>
                    <span class="queue-marker-name">上货2</span>
                  </div>
                </div>

                <!-- 缓存区1数量标记 -->
                <div
                  class="queue-marker special-queue"
                  data-x="1725"
                  data-y="1230"
                  style="
                    position: absolute;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                  "
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count">
                      {{ buffer1Quantity }}
                    </span>
                    <span class="queue-marker-name">缓存1</span>
                  </div>
                </div>

                <!-- 缓存区2数量标记 -->
                <div
                  class="queue-marker special-queue"
                  data-x="1000"
                  data-y="1230"
                  style="
                    position: absolute;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                  "
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count">
                      {{ buffer2Quantity }}
                    </span>
                    <span class="queue-marker-name">缓存2</span>
                  </div>
                </div>

                <!-- 预热、灭菌、解析柜状态标签 - 每个标签独立位置 -->
                <!-- A1预热完成状态标签 -->
                <div class="analysis-status-marker" data-x="1160" data-y="1170">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit0 === '1'"
                    type="success"
                    size="small"
                  >
                    A1预热完成
                  </el-tag>
                </div>

                <!-- B1预热完成状态标签 -->
                <div class="analysis-status-marker" data-x="1160" data-y="955">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit3 === '1'"
                    type="success"
                    size="small"
                  >
                    B1预热完成
                  </el-tag>
                </div>

                <!-- C1预热完成状态标签 -->
                <div class="analysis-status-marker" data-x="1160" data-y="735">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit6 === '1'"
                    type="success"
                    size="small"
                  >
                    C1预热完成
                  </el-tag>
                </div>

                <!-- A2灭菌完成状态标签 -->
                <div class="analysis-status-marker" data-x="1740" data-y="1160">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit1 === '1'"
                    type="success"
                    size="small"
                  >
                    A2灭菌完成
                  </el-tag>
                </div>

                <!-- B2灭菌完成状态标签 -->
                <div class="analysis-status-marker" data-x="1740" data-y="955">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit4 === '1'"
                    type="success"
                    size="small"
                  >
                    B2灭菌完成
                  </el-tag>
                </div>

                <!-- C2灭菌完成状态标签 -->
                <div class="analysis-status-marker" data-x="1740" data-y="735">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit7 === '1'"
                    type="success"
                    size="small"
                  >
                    C2灭菌完成
                  </el-tag>
                </div>

                <!-- A3解析完成状态标签 -->
                <div class="analysis-status-marker" data-x="2180" data-y="1165">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit2 === '1'"
                    type="success"
                    size="small"
                  >
                    A3解析完成
                  </el-tag>
                </div>

                <!-- B3解析完成状态标签 -->
                <div class="analysis-status-marker" data-x="2180" data-y="955">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit5 === '1'"
                    type="success"
                    size="small"
                  >
                    B3解析完成
                  </el-tag>
                </div>

                <!-- C3解析完成状态标签 -->
                <div class="analysis-status-marker" data-x="2180" data-y="740">
                  <el-tag
                    v-show="preheatingDisinfectionAnalysisState.bit8 === '1'"
                    type="success"
                    size="small"
                  >
                    C3解析完成
                  </el-tag>
                </div>
                <div
                  class="preheating-room-marker"
                  data-x="610"
                  data-y="1155"
                  v-show="showCar1SetPreheatingRoom"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">预热房选择</div>
                    <div class="preheating-room-body">
                      <el-select
                        v-model="preheatingRoomSelected"
                        placeholder="选择"
                        size="mini"
                        style="width: 100%; margin-bottom: 2px"
                      >
                        <el-option label="不执行" :value="null"></el-option>
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                      </el-select>
                      <el-input-number
                        v-model="preheatExecQty"
                        :min="0"
                        size="mini"
                        :disabled="preheatExecuting"
                        :controls="false"
                        placeholder="执行数量"
                        style="width: 100%; font-size: 10px; margin-bottom: 2px"
                      />
                      <el-button
                        type="primary"
                        size="mini"
                        @click="sendToPreheatingRoom"
                        :loading="preheatingRoomLoading"
                        style="width: 100%"
                        >执行</el-button
                      >
                      <el-button
                        v-if="preheatExecuting"
                        type="danger"
                        size="mini"
                        @click="cancelPreheatingRoom"
                        style="width: 100%; margin-left: 0px"
                        >取消</el-button
                      >
                      <div
                        style="
                          font-size: 12px;
                          color: #9fe3d3;
                          text-align: center;
                        "
                      >
                        需进货：<b>{{ preheatNeedQty }}</b>
                      </div>
                      <span
                        style="font-size: 12px; color: greenyellow"
                        v-if="preWarmTrayCode"
                        >执行中：{{ preWarmTrayCode }}</span
                      >
                    </div>
                  </div>
                </div>
                <div
                  class="preheating-room-marker"
                  data-x="865"
                  data-y="380"
                  style="width: 160px"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">预热房到灭菌柜选择</div>
                    <div class="preheating-room-body">
                      <div style="display: flex; align-items: center">
                        <el-select
                          v-model="disinfectionRoomSelectedFrom"
                          placeholder="预热"
                          size="mini"
                        >
                          <el-option label="不执行" :value="null"></el-option>
                          <el-option label="A" value="A"></el-option>
                          <el-option label="B" value="B"></el-option>
                          <el-option label="C" value="C"></el-option>
                        </el-select>
                        <span
                          style="font-size: 12px; color: #fff; margin-left: 5px"
                          >到：</span
                        >
                        <el-select
                          v-model="disinfectionRoomSelectedTo"
                          placeholder="灭菌"
                          size="mini"
                        >
                          <el-option label="不执行" :value="null"></el-option>
                          <el-option label="A" value="A"></el-option>
                          <el-option label="B" value="B"></el-option>
                          <el-option label="C" value="C"></el-option>
                        </el-select>
                      </div>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="sendToDisinfectionRoom"
                        :loading="disinfectionRoomLoading"
                        style="width: 100%"
                        >执行</el-button
                      >
                      <el-button
                        v-if="disinfectionExecuting"
                        type="danger"
                        size="mini"
                        @click="cancelDisinfectionRoom"
                        style="width: 100%; margin-left: 0px"
                        >取消</el-button
                      >
                      <div
                        style="display: flex; align-items: center"
                        v-if="disinfectionTrayCode"
                      >
                        <span
                          style="
                            font-size: 12px;
                            color: #fff;
                            color: greenyellow;
                          "
                          v-if="disinfectionTrayCode"
                          >执行中：{{ disinfectionTrayCode }}</span
                        >
                      </div>
                      <div style="font-size: 12px; color: #9fe3d3">
                        需进货：<b>{{ disinfectionNeedQty }}</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="preheating-room-marker"
                  data-x="1215"
                  data-y="380"
                  style="width: 160px"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">灭菌柜到解析房选择</div>
                    <div class="preheating-room-body">
                      <div style="display: flex; align-items: center">
                        <el-select
                          v-model="warehouseSelectedFrom"
                          placeholder="灭菌"
                          size="mini"
                        >
                          <el-option label="不执行" :value="null"></el-option>
                          <el-option label="A" value="A"></el-option>
                          <el-option label="B" value="B"></el-option>
                          <el-option label="C" value="C"></el-option>
                        </el-select>
                        <span
                          style="font-size: 12px; color: #fff; margin-left: 5px"
                          >到：</span
                        >
                        <el-select
                          v-model="warehouseSelectedTo"
                          placeholder="解析"
                          size="mini"
                        >
                          <el-option label="不执行" :value="null"></el-option>
                          <el-option label="A" value="A"></el-option>
                          <el-option label="B" value="B"></el-option>
                          <el-option label="C" value="C"></el-option>
                        </el-select>
                      </div>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="sendDisinfectionRoomToWarehouse"
                        :loading="analysisRoomLoading"
                        style="width: 100%"
                        >执行</el-button
                      >
                      <el-button
                        v-if="analysisExecuting"
                        type="danger"
                        size="mini"
                        @click="cancelAnalysisRoom"
                        style="width: 100%; margin-left: 0px"
                        >取消</el-button
                      >
                      <div
                        style="display: flex; align-items: center"
                        v-if="analysisTrayCode"
                      >
                        <span
                          style="
                            font-size: 12px;
                            color: #fff;
                            color: greenyellow;
                          "
                          v-if="analysisTrayCode"
                          >执行中：{{ analysisTrayCode }}</span
                        >
                      </div>
                      <div style="font-size: 12px; color: #9fe3d3">
                        需进货：<b>{{ analysisNeedQty }}</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="preheating-room-marker" data-x="2620" data-y="750">
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">出库选择</div>
                    <div class="preheating-room-body">
                      <el-select
                        v-model="outWarehouseSelected"
                        placeholder="选择"
                        size="mini"
                      >
                        <el-option label="不执行" :value="null"></el-option>
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                        <el-option label="D" value="D"></el-option>
                        <el-option label="E" value="E"></el-option>
                      </el-select>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="sendToWarehouse"
                        :loading="outWarehouseLoading"
                        style="width: 100%"
                        >执行</el-button
                      >
                      <el-button
                        v-if="outWarehouseExecuting"
                        type="danger"
                        size="mini"
                        @click="cancelOutWarehouse"
                        style="width: 100%; margin-left: 0px"
                        >取消</el-button
                      >
                      <span
                        style="font-size: 12px; color: #fff; color: greenyellow"
                        v-if="outWarehouseTrayCode"
                        >执行中：{{ outWarehouseTrayCode }}</span
                      >
                      <div
                        style="margin-top: 4px; font-size: 12px; color: #9fe3d3"
                      >
                        需进货：<b>{{ outNeedQty }}</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-button" data-x="1470" data-y="1228">
                  <el-button
                    type="primary"
                    class="warehouse-btn"
                    @click="showCarSelect"
                    >入库</el-button
                  >
                </div>
                <!-- 修改小车元素 -->
                <div
                  v-for="cart in carts"
                  :key="cart.name"
                  class="cart-container"
                  :data-x="cart.x"
                  :data-y="cart.y"
                  :data-width="cart.width"
                >
                  <img :src="cart.image" :alt="cart.name" class="cart-image" />
                </div>
                <!-- 上货扫码区域提示 -->
                <div class="marker-with-panel" data-x="480" data-y="1590">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">一楼扫码信息：</span>
                        <span>{{ elevatorOneFloorScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadOne"
                          @change="handleAllowUpload('1')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox
                          v-model="nonSterileOne"
                          @change="
                            handleNonSterileChange('nonSterileOne', '一楼')
                          "
                          >非灭菌</el-checkbox
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 无码上货按钮 -->
                <div class="marker-with-button" data-x="450" data-y="1650">
                  <div style="display: flex; align-items: center">
                    <el-button
                      :type="noCodeUpload ? 'success' : 'primary'"
                      size="mini"
                      @click="toggleNoCodeUpload"
                      :icon="
                        noCodeUpload ? 'el-icon-loading' : 'el-icon-setting'
                      "
                    >
                      {{
                        noCodeUpload
                          ? '正在使用无码上货模式'
                          : '设置为无码上货模式'
                      }}
                    </el-button>
                    <!-- 当前运行模式状态显示 -->
                    <div
                      class="mode-status-display"
                      style="
                        margin-left: 10px;
                        font-weight: bold;
                        color: #f56c6c;
                        font-size: 20px;
                        white-space: nowrap;
                      "
                    >
                      <span style="color: #606266">当前运行模式：</span
                      >{{ noCodeUpload ? '无码模式' : '有码模式' }}
                      <!-- 深灰标签 + 红色状态 -->
                    </div>
                  </div>
                </div>
                <!-- 下货信息展示 -->
                <div class="marker-with-panel" data-x="2750" data-y="130">
                  <div
                    class="data-panel"
                    :class="['position-left', { 'always-show': true }]"
                  >
                    <div class="data-panel-header">下货信息</div>
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">产品名称：</span>
                        <span>{{
                          currentOutTrayInfo.productName
                            ? currentOutTrayInfo.productName
                            : '--'
                        }}</span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">托盘号：</span>
                        <span>{{
                          currentOutTrayInfo.trayCode
                            ? currentOutTrayInfo.trayCode
                            : '--'
                        }}</span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">是否灭菌：</span>
                        <span>{{
                          currentOutTrayInfo.trayCode
                            ? currentOutTrayInfo.isTerile === 1
                              ? '灭菌'
                              : '非灭菌'
                            : '--'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="480" data-y="920">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">二楼扫码信息：</span>
                        <span>{{ elevatorTwoFloorScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadTwo"
                          @change="handleAllowUpload('2')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox
                          v-model="nonSterileTwo"
                          @change="
                            handleNonSterileChange('nonSterileTwo', '二楼')
                          "
                          >非灭菌</el-checkbox
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="480" data-y="535">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">三楼扫码信息：</span>
                        <span>{{ elevatorThreeFloorScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadThree"
                          @change="handleAllowUpload('3')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox
                          v-model="nonSterileThree"
                          @change="
                            handleNonSterileChange('nonSterileThree', '三楼')
                          "
                          >非灭菌</el-checkbox
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="480" data-y="200">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">四楼扫码信息：</span>
                        <span>{{ elevatorFourFloorScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadFour"
                          @change="handleAllowUpload('4')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox
                          v-model="nonSterileFour"
                          @change="
                            handleNonSterileChange('nonSterileFour', '四楼')
                          "
                          >非灭菌</el-checkbox
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="1560" data-y="600">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                    style="width: 140px; padding-left: 8px; padding-right: 8px"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">D扫码：</span>
                        <span>{{ elevatorDDisinfectionScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadD"
                          @change="handleAllowUpload('D')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox
                          v-show="false"
                          v-model="nonSterileD"
                          @change="
                            handleNonSterileChange('nonSterileD', 'D灭菌柜')
                          "
                          >非灭菌</el-checkbox
                        >
                      </div>
                      <div
                        class="data-panel-row exec-controls"
                        style="margin-top: 4px"
                      >
                        <el-input-number
                          v-model="dExecQty"
                          :min="0"
                          size="mini"
                          :disabled="dExecuting"
                          :controls="false"
                          placeholder="执行数量"
                          style="width: 98px; font-size: 10px"
                        />
                        <el-button
                          v-if="!dExecuting"
                          type="primary"
                          size="mini"
                          @click="confirmDExecution"
                          style="font-size: 10px; padding: 2px 6px"
                          >确定</el-button
                        >
                        <el-button
                          v-if="dExecuting"
                          type="warning"
                          size="mini"
                          style="font-size: 10px; padding: 2px 6px"
                          @click="cancelDExecution"
                          >取消</el-button
                        >
                      </div>
                      <div
                        style="margin-top: 4px; font-size: 12px; color: #9fe3d3"
                      >
                        需进货：<b>{{ dNeedQty }}</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="1560" data-y="350">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                    style="width: 140px; padding-left: 8px; padding-right: 8px"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">E扫码：</span>
                        <span>{{ elevatorEDisinfectionScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadE"
                          @change="handleAllowUpload('E')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox
                          v-show="false"
                          v-model="nonSterileE"
                          @change="
                            handleNonSterileChange('nonSterileE', 'E灭菌柜')
                          "
                          >非灭菌</el-checkbox
                        >
                      </div>
                      <div
                        class="data-panel-row exec-controls"
                        style="margin-top: 4px"
                      >
                        <el-input-number
                          v-model="eExecQty"
                          :min="0"
                          size="mini"
                          :disabled="eExecuting"
                          :controls="false"
                          placeholder="执行数量"
                          style="width: 98px; font-size: 10px"
                        />
                        <el-button
                          v-if="!eExecuting"
                          type="primary"
                          size="mini"
                          @click="confirmEExecution"
                          style="font-size: 10px; padding: 2px 6px"
                          >确定</el-button
                        >
                        <el-button
                          v-if="eExecuting"
                          type="warning"
                          size="mini"
                          style="font-size: 10px; padding: 2px 6px"
                          @click="cancelEExecution"
                          >取消</el-button
                        >
                      </div>
                      <div
                        style="margin-top: 4px; font-size: 12px; color: #9fe3d3"
                      >
                        需进货：<b>{{ eNeedQty }}</b>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="2200" data-y="1620">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">缓冲区扫码：</span>
                        <span>{{ oneFloorElevatorScanCode || '--' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 光电集合，光电标签默认在下方，可以控制标签位置：label-top、label-left、label-right -->
                <!-- 上货区输送线光电信号 -->
                <div
                  class="marker"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit0 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">S-1#</div>
                </div>
                <div
                  class="marker"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit1 === '1' }"
                  data-x="1440"
                  data-y="1380"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">S-2#</div>
                </div>
                <div
                  class="marker label-left"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit3 === '1' }"
                  data-x="2190"
                  data-y="1380"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">S-4#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit5 === '1' }"
                  data-x="2475"
                  data-y="1340"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">S-6#</div>
                </div>
                <div
                  class="marker label-top"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit6 === '1' }"
                  data-x="2440"
                  data-y="1180"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">S-7#</div>
                </div>
                <div
                  class="marker label-top"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit7 === '1' }"
                  data-x="2290"
                  data-y="1180"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">S-8#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit8 === '1' }"
                  data-x="2480"
                  data-y="1180"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">S-9#</div>
                </div>
                <div
                  class="marker"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit9 === '1' }"
                  data-x="1570"
                  data-y="1266"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">S-10#</div>
                </div>
                <div
                  class="marker"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit10 === '1' }"
                  data-x="860"
                  data-y="1266"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit10')"
                >
                  <div class="marker-label">S-11#</div>
                </div>
                <!-- 电机点位示例，可以控制标签位置：label-top、label-left、label-right -->
                <!-- 上货区电机运行信号（扫码后入队） -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit0 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit0')"
                >
                  <div class="marker-label">S1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit1 === '1' }"
                  data-x="1910"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit1')"
                >
                  <div class="marker-label">S2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit2 === '1' }"
                  data-x="2300"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit2')"
                >
                  <div class="marker-label">S3#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit3 === '1' }"
                  data-x="2385"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit3')"
                >
                  <div class="marker-label">S4#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit4 === '1' }"
                  data-x="2470"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit4')"
                >
                  <div class="marker-label">S5#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: upLoadMotorRunning.bit5 === '1' }"
                  data-x="2330"
                  data-y="1287"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit5')"
                >
                  <div class="marker-label">S6#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: upLoadMotorRunning.bit6 === '1' }"
                  data-x="2385"
                  data-y="1210"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit6')"
                >
                  <div class="marker-label">S7#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: upLoadMotorRunning.bit7 === '1' }"
                  data-x="2460"
                  data-y="1230"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit7')"
                >
                  <div class="marker-label">S8#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: upLoadMotorRunning.bit8 === '1' }"
                  data-x="2260"
                  data-y="1230"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit8')"
                >
                  <div class="marker-label">S9#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit9 === '1' }"
                  data-x="1910"
                  data-y="1220"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit9')"
                >
                  <div class="marker-label">S10#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit10 === '1' }"
                  data-x="1130"
                  data-y="1220"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit10')"
                >
                  <div class="marker-label">S11#</div>
                </div>
                <!-- A线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: aLineMotorRunning.bit0 === '1' }"
                  data-x="1150"
                  data-y="1098"
                  @click="toggleBitValue(aLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">A1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: aLineMotorRunning.bit1 === '1' }"
                  data-x="1150"
                  data-y="1030"
                  @click="toggleBitValue(aLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">A1-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: aLineMotorRunning.bit2 === '1' }"
                  data-x="1820"
                  data-y="1098"
                  @click="toggleBitValue(aLineMotorRunning, 'bit2')"
                >
                  <div class="marker-label">A2-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: aLineMotorRunning.bit3 === '1' }"
                  data-x="1820"
                  data-y="1030"
                  @click="toggleBitValue(aLineMotorRunning, 'bit3')"
                >
                  <div class="marker-label">A2-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: aLineMotorRunning.bit4 === '1' }"
                  data-x="2320"
                  data-y="1090"
                  @click="toggleBitValue(aLineMotorRunning, 'bit4')"
                >
                  <div class="marker-label">A3-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: aLineMotorRunning.bit5 === '1' }"
                  data-x="2320"
                  data-y="1025"
                  @click="toggleBitValue(aLineMotorRunning, 'bit5')"
                >
                  <div class="marker-label">A3-2#</div>
                </div>
                <!-- A线光电检测信号 -->
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit0 === '1' }"
                  data-x="840"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">A-1#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="840"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">A-2#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1320"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">A-3#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="1320"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">A-4#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="1435"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">A-5#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit5 === '1' }"
                  data-x="1435"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">A-6#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit6 === '1' }"
                  data-x="2020"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">A-7#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit7 === '1' }"
                  data-x="2020"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">A-8#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: aLinePhotoelectricSignal.bit8 === '1' }"
                  data-x="2470"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">A-9#</div>
                </div>
                <div
                  class="marker label-top"
                  :class="{ scanning: aLinePhotoelectricSignal.bit9 === '1' }"
                  data-x="2470"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">A-10#</div>
                </div>
                <!-- B线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: bLineMotorRunning.bit0 === '1' }"
                  data-x="1150"
                  data-y="880"
                  @click="toggleBitValue(bLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">B1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: bLineMotorRunning.bit1 === '1' }"
                  data-x="1150"
                  data-y="810"
                  @click="toggleBitValue(bLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">B1-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: bLineMotorRunning.bit2 === '1' }"
                  data-x="1820"
                  data-y="880"
                  @click="toggleBitValue(bLineMotorRunning, 'bit2')"
                >
                  <div class="marker-label">B2-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: bLineMotorRunning.bit3 === '1' }"
                  data-x="1820"
                  data-y="810"
                  @click="toggleBitValue(bLineMotorRunning, 'bit3')"
                >
                  <div class="marker-label">B2-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: bLineMotorRunning.bit4 === '1' }"
                  data-x="2320"
                  data-y="880"
                  @click="toggleBitValue(bLineMotorRunning, 'bit4')"
                >
                  <div class="marker-label">B3-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: bLineMotorRunning.bit5 === '1' }"
                  data-x="2320"
                  data-y="810"
                  @click="toggleBitValue(bLineMotorRunning, 'bit5')"
                >
                  <div class="marker-label">B3-2#</div>
                </div>
                <!-- B线光电检测信号 -->
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit0 === '1' }"
                  data-x="840"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">B-1#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="840"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">B-2#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1320"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">B-3#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="1320"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">B-4#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="1435"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">B-5#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit5 === '1' }"
                  data-x="1435"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">B-6#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit6 === '1' }"
                  data-x="2020"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">B-7#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit7 === '1' }"
                  data-x="2020"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">B-8#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit8 === '1' }"
                  data-x="2470"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">B-9#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit9 === '1' }"
                  data-x="2470"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">B-10#</div>
                </div>

                <!-- C线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: cLineMotorRunning.bit0 === '1' }"
                  data-x="1150"
                  data-y="678"
                  @click="toggleBitValue(cLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">C1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: cLineMotorRunning.bit1 === '1' }"
                  data-x="1150"
                  data-y="615"
                  @click="toggleBitValue(cLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">C1-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: cLineMotorRunning.bit2 === '1' }"
                  data-x="1820"
                  data-y="678"
                  @click="toggleBitValue(cLineMotorRunning, 'bit2')"
                >
                  <div class="marker-label">C2-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: cLineMotorRunning.bit3 === '1' }"
                  data-x="1820"
                  data-y="615"
                  @click="toggleBitValue(cLineMotorRunning, 'bit3')"
                >
                  <div class="marker-label">C2-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: cLineMotorRunning.bit4 === '1' }"
                  data-x="2320"
                  data-y="678"
                  @click="toggleBitValue(cLineMotorRunning, 'bit4')"
                >
                  <div class="marker-label">C3-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: cLineMotorRunning.bit5 === '1' }"
                  data-x="2320"
                  data-y="615"
                  @click="toggleBitValue(cLineMotorRunning, 'bit5')"
                >
                  <div class="marker-label">C3-2#</div>
                </div>
                <!-- C线光电检测信号 -->
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit0 === '1' }"
                  data-x="840"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">C-1#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="840"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">C-2#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1320"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">C-3#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="1320"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">C-4#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="1435"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">C-5#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit5 === '1' }"
                  data-x="1435"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">C-6#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit6 === '1' }"
                  data-x="2020"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">C-7#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit7 === '1' }"
                  data-x="2020"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">C-8#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit8 === '1' }"
                  data-x="2470"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">C-9#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit9 === '1' }"
                  data-x="2470"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">C-10#</div>
                </div>
                <!-- D线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: dLineMotorRunning.bit0 === '1' }"
                  data-x="1850"
                  data-y="480"
                  @click="toggleBitValue(dLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">D1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: dLineMotorRunning.bit1 === '1' }"
                  data-x="2420"
                  data-y="480"
                  @click="toggleBitValue(dLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">D1-2#</div>
                </div>
                <!-- D线光电检测信号 -->
                <div
                  class="marker label-bottom"
                  :class="{ scanning: dLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="1830"
                  data-y="510"
                  @click="toggleBitValue(dLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">D-2#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: dLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1860"
                  data-y="510"
                  @click="toggleBitValue(dLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">D-3#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: dLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="2420"
                  data-y="510"
                  @click="toggleBitValue(dLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">D-4#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: dLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="2460"
                  data-y="510"
                  @click="toggleBitValue(dLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">D-5#</div>
                </div>
                <!-- E线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: eLineMotorRunning.bit0 === '1' }"
                  data-x="1850"
                  data-y="330"
                  @click="toggleBitValue(eLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">E1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: eLineMotorRunning.bit1 === '1' }"
                  data-x="2420"
                  data-y="330"
                  @click="toggleBitValue(eLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">E1-2#</div>
                </div>
                <!-- E线光电检测信号 -->
                <div
                  class="marker label-bottom"
                  :class="{ scanning: eLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="1830"
                  data-y="360"
                  @click="toggleBitValue(eLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">E-2#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: eLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1860"
                  data-y="360"
                  @click="toggleBitValue(eLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">E-3#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: eLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="2420"
                  data-y="360"
                  @click="toggleBitValue(eLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">E-4#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: eLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="2460"
                  data-y="360"
                  @click="toggleBitValue(eLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">E-5#</div>
                </div>

                <!-- 扫码枪处光电信号 -->
                <div
                  class="marker marker-show-label label-left"
                  :class="{ scanning: scanPhotoelectricSignal.bit0 === '1' }"
                  data-x="335"
                  data-y="1360"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">1-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-left"
                  :class="{ scanning: scanPhotoelectricSignal.bit1 === '1' }"
                  data-x="2335"
                  data-y="1343"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">1-2#</div>
                </div>
                <div
                  class="marker marker-show-label label-right"
                  :class="{ scanning: scanPhotoelectricSignal.bit2 === '1' }"
                  data-x="585"
                  data-y="915"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">2-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-right"
                  :class="{ scanning: scanPhotoelectricSignal.bit4 === '1' }"
                  data-x="515"
                  data-y="525"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">3-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-right"
                  :class="{ scanning: scanPhotoelectricSignal.bit5 === '1' }"
                  data-x="400"
                  data-y="270"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">4-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-bottom"
                  :class="{ scanning: scanPhotoelectricSignal.bit7 === '1' }"
                  data-x="1760"
                  data-y="500"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">D-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-bottom"
                  :class="{ scanning: scanPhotoelectricSignal.bit8 === '1' }"
                  data-x="1760"
                  data-y="350"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">E-1#</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧队列信息区 -->
    <div
      class="side-info-panel-queue"
      :style="{
        width: isQueueExpanded ? '850px' : 'auto',
        height: isQueueExpanded ? 'calc(100% - 40px)' : 'auto'
      }"
    >
      <!-- 队列信息区域 -->
      <div class="queue-section" :class="{ expanded: isQueueExpanded }">
        <div class="section-header">
          <template v-if="isQueueExpanded">
            <div class="header-left">
              <span><i class="el-icon-s-data"></i> 队列信息</span>
              <el-button
                type="primary"
                size="mini"
                icon="el-icon-search"
                @click.stop="showTraySearchDialog"
                style="margin-left: 15px"
              >
                检索托盘
              </el-button>
            </div>
            <span
              class="arrow-icon"
              :class="{ 'expanded-arrow': isQueueExpanded }"
              @click="changeQueueExpanded"
              >▼</span
            >
          </template>
          <template v-else>
            <i class="el-icon-s-data" @click="changeQueueExpanded"></i>
          </template>
        </div>
        <div v-if="isQueueExpanded" class="expandable-content-queue">
          <div class="queue-container">
            <!-- 左侧队列列表 -->
            <div class="queue-container-left">
              <div
                v-for="(queue, filteredIndex) in filteredQueues"
                :key="'queue-' + queue.id + '-' + filteredIndex"
                class="queue"
                :class="{ active: selectedQueueIndex === queue.id - 1 }"
                @click="showTrays(queue.id - 1)"
                @dragover.prevent
                @drop="handleDrop(queue.id - 1)"
              >
                <span class="queue-name">{{ queue.queueName }}</span>
                <span class="tray-count">{{
                  queue.trayInfo?.length || 0
                }}</span>
              </div>
            </div>

            <!-- 右侧托盘列表 -->
            <div class="queue-container-right">
              <div class="selected-queue-header" v-if="selectedQueue">
                <h3>{{ selectedQueue.queueName }}</h3>
                <div class="queue-header-actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="showAddTrayDialog"
                    :disabled="!selectedQueue"
                    icon="el-icon-plus"
                  >
                    添加托盘
                  </el-button>
                  <span class="tray-total"
                    >托盘数量: {{ selectedQueue.trayInfo?.length || 0 }}</span
                  >
                </div>
              </div>
              <div class="tray-list">
                <template v-if="nowTrays && nowTrays.length > 0">
                  <div
                    v-for="(tray, index) in nowTrays"
                    :key="'tray-' + tray.id + '-' + index"
                    class="tray-item"
                    :class="{
                      dragging: isDragging && draggedTray?.id === tray.id
                    }"
                    draggable="true"
                    @dragstart="
                      handleDragStart($event, tray, selectedQueueIndex)
                    "
                    @dragend="handleDragEnd"
                  >
                    <div class="tray-info">
                      <div class="tray-info-row">
                        <span class="tray-name">{{ tray.name }}</span>
                        <div class="tray-batch-group">
                          <span class="tray-batch">
                            <span>
                              {{
                                tray.isTerile === 1 ? '消毒' : '不消毒'
                              }}</span
                            >
                          </span>
                          <span
                            class="tray-batch"
                            v-if="
                              tray.sendTo &&
                              [
                                'A1',
                                'B1',
                                'C1',
                                'A2',
                                'B2',
                                'C2',
                                'A3',
                                'B3',
                                'C3',
                                '缓存区'
                              ].includes(selectedQueue.queueName)
                            "
                            >{{
                              ['A1', 'B1', 'C1'].includes(
                                selectedQueue.queueName
                              )
                                ? '预热房位置：'
                                : ['A2', 'B2', 'C2'].includes(
                                    selectedQueue.queueName
                                  )
                                ? '灭菌柜位置：'
                                : ['A3', 'B3', 'C3'].includes(
                                    selectedQueue.queueName
                                  )
                                ? '解析柜位置：'
                                : '预热房发送中：'
                            }}{{ tray.sendTo }}</span
                          >
                          <span
                            class="tray-batch"
                            v-if="tray.sequenceNumber > 0"
                            ><span class="sequence-number"
                              >(序号：{{ tray.sequenceNumber }})</span
                            ></span
                          >
                          <span
                            class="tray-batch"
                            v-if="selectedQueue.queueName == '分发区'"
                            >PLC命令：{{
                              tray.state === '0' ? '未执行' : '已执行'
                            }}</span
                          >
                        </div>
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >订单ID：{{ tray.orderId || '--' }}</span
                        >
                        <span class="tray-detail"
                          >物料编码：{{ tray.productCode || '--' }}</span
                        >
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >产品名称：{{ tray.productName || '--' }}</span
                        >
                        <span class="tray-detail"
                          >规格：{{ tray.unit || '--' }}</span
                        >
                      </div>
                      <div class="tray-info-row">
                        <span class="tray-detail"
                          >批次：{{ tray.batchNo || '--' }}</span
                        >
                        <span class="tray-detail"
                          >备注：{{ tray.remark || '--' }}</span
                        >
                      </div>
                      <span class="tray-time">{{ tray.time }}</span>
                    </div>
                    <div class="tray-actions">
                      <el-button
                        type="primary"
                        size="mini"
                        icon="el-icon-arrow-up"
                        circle
                        :disabled="index === 0"
                        @click.stop="moveTrayUp(index)"
                        class="move-btn"
                      ></el-button>
                      <el-button
                        type="primary"
                        size="mini"
                        icon="el-icon-arrow-down"
                        circle
                        :disabled="index === nowTrays.length - 1"
                        @click.stop="moveTrayDown(index)"
                        class="move-btn"
                      ></el-button>
                      <el-button
                        type="danger"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        @click.stop="deleteTray(tray, index)"
                      ></el-button>
                    </div>
                  </div>
                </template>
                <div v-else class="empty-state">
                  <i class="el-icon-box"></i>
                  <p>暂无托盘信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试面板 -->
    <div class="test-panel-container">
      <!-- 测试按钮 -->
      <div class="test-toggle-btn" @click="showTestPanel = !showTestPanel">
        <i class="el-icon-setting"></i>
      </div>
      <!-- 测试面板 -->
      <div class="test-panel" :class="{ collapsed: !showTestPanel }">
        <div class="test-panel-header">
          <span>测试面板</span>
          <i class="el-icon-close" @click.stop="showTestPanel = false"></i>
        </div>
        <div class="test-panel-content">
          <!-- 添加PLC变量写入测试部分 -->
          <div class="test-section">
            <span class="test-label">PLC变量写入:</span>
            <div class="plc-test-wrapper">
              <el-collapse v-model="activePlcGroups" accordion>
                <!-- 入库缓存区 -->
                <el-collapse-item title="入库缓存区" name="1">
                  <div class="compact-grid">
                    <div class="compact-input-group">
                      <div class="compact-label">入库1线:</div>
                      <el-input
                        v-model="plcWriteValues.inboundLine1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeInboundLine1"
                        :loading="plcWriteLoading.inboundLine1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">入库2线:</div>
                      <el-input
                        v-model="plcWriteValues.inboundLine2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeInboundLine2"
                        :loading="plcWriteLoading.inboundLine2"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">缓存1#线:</div>
                      <el-input
                        v-model="plcWriteValues.bufferLine1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeBufferLine1"
                        :loading="plcWriteLoading.bufferLine1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">缓存2#线:</div>
                      <el-input
                        v-model="plcWriteValues.bufferLine2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeBufferLine2"
                        :loading="plcWriteLoading.bufferLine2"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">缓存数量:</div>
                      <el-input
                        v-model="plcWriteValues.bufferCount"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeBufferCount"
                        :loading="plcWriteLoading.bufferCount"
                        >写</el-button
                      >
                    </div>
                  </div>
                </el-collapse-item>

                <!-- A线 -->
                <el-collapse-item title="A线" name="2">
                  <div class="compact-grid">
                    <div class="compact-input-group">
                      <div class="compact-label">A1预热1:</div>
                      <el-input
                        v-model="plcWriteValues.a1Preheat1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeA1Preheat1"
                        :loading="plcWriteLoading.a1Preheat1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">A1预热2:</div>
                      <el-input
                        v-model="plcWriteValues.a1Preheat2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeA1Preheat2"
                        :loading="plcWriteLoading.a1Preheat2"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">A2灭菌1:</div>
                      <el-input
                        v-model="plcWriteValues.a2Sterile1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeA2Sterile1"
                        :loading="plcWriteLoading.a2Sterile1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">A2灭菌2:</div>
                      <el-input
                        v-model="plcWriteValues.a2Sterile2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeA2Sterile2"
                        :loading="plcWriteLoading.a2Sterile2"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">A3解析1:</div>
                      <el-input
                        v-model="plcWriteValues.a3Analysis1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeA3Analysis1"
                        :loading="plcWriteLoading.a3Analysis1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">A3解析2:</div>
                      <el-input
                        v-model="plcWriteValues.a3Analysis2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeA3Analysis2"
                        :loading="plcWriteLoading.a3Analysis2"
                        >写</el-button
                      >
                    </div>
                  </div>
                </el-collapse-item>

                <!-- B线 -->
                <el-collapse-item title="B线" name="3">
                  <div class="compact-grid">
                    <div class="compact-input-group">
                      <div class="compact-label">B1预热1:</div>
                      <el-input
                        v-model="plcWriteValues.b1Preheat1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeB1Preheat1"
                        :loading="plcWriteLoading.b1Preheat1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">B1预热2:</div>
                      <el-input
                        v-model="plcWriteValues.b1Preheat2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeB1Preheat2"
                        :loading="plcWriteLoading.b1Preheat2"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">B2灭菌1:</div>
                      <el-input
                        v-model="plcWriteValues.b2Sterile1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeB2Sterile1"
                        :loading="plcWriteLoading.b2Sterile1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">B2灭菌2:</div>
                      <el-input
                        v-model="plcWriteValues.b2Sterile2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeB2Sterile2"
                        :loading="plcWriteLoading.b2Sterile2"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">B3解析1:</div>
                      <el-input
                        v-model="plcWriteValues.b3Analysis1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeB3Analysis1"
                        :loading="plcWriteLoading.b3Analysis1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">B3解析2:</div>
                      <el-input
                        v-model="plcWriteValues.b3Analysis2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeB3Analysis2"
                        :loading="plcWriteLoading.b3Analysis2"
                        >写</el-button
                      >
                    </div>
                  </div>
                </el-collapse-item>

                <!-- C线 -->
                <el-collapse-item title="C线" name="4">
                  <div class="compact-grid">
                    <div class="compact-input-group">
                      <div class="compact-label">C1预热1:</div>
                      <el-input
                        v-model="plcWriteValues.c1Preheat1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeC1Preheat1"
                        :loading="plcWriteLoading.c1Preheat1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">C1预热2:</div>
                      <el-input
                        v-model="plcWriteValues.c1Preheat2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeC1Preheat2"
                        :loading="plcWriteLoading.c1Preheat2"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">C2灭菌1:</div>
                      <el-input
                        v-model="plcWriteValues.c2Sterile1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeC2Sterile1"
                        :loading="plcWriteLoading.c2Sterile1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">C2灭菌2:</div>
                      <el-input
                        v-model="plcWriteValues.c2Sterile2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeC2Sterile2"
                        :loading="plcWriteLoading.c2Sterile2"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">C3解析1:</div>
                      <el-input
                        v-model="plcWriteValues.c3Analysis1"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeC3Analysis1"
                        :loading="plcWriteLoading.c3Analysis1"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">C3解析2:</div>
                      <el-input
                        v-model="plcWriteValues.c3Analysis2"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeC3Analysis2"
                        :loading="plcWriteLoading.c3Analysis2"
                        >写</el-button
                      >
                    </div>
                  </div>
                </el-collapse-item>

                <!-- D\E线 -->
                <el-collapse-item title="D\E线" name="5">
                  <div class="compact-grid">
                    <div class="compact-input-group">
                      <div class="compact-label">D线灭菌进:</div>
                      <el-input
                        v-model="plcWriteValues.dSterileIn"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeDSterileIn"
                        :loading="plcWriteLoading.dSterileIn"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">D线灭菌出:</div>
                      <el-input
                        v-model="plcWriteValues.dSterileOut"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeDSterileOut"
                        :loading="plcWriteLoading.dSterileOut"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">E线灭菌进:</div>
                      <el-input
                        v-model="plcWriteValues.eSterileIn"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeESterileIn"
                        :loading="plcWriteLoading.eSterileIn"
                        >写</el-button
                      >
                    </div>
                    <div class="compact-input-group">
                      <div class="compact-label">E线灭菌出:</div>
                      <el-input
                        v-model="plcWriteValues.eSterileOut"
                        size="mini"
                        class="qrcode-input"
                        type="number"
                      ></el-input>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="writeESterileOut"
                        :loading="plcWriteLoading.eSterileOut"
                        >写</el-button
                      >
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>

          <!-- 上货一键放行按钮 -->
          <div class="test-section">
            <span class="test-label">上货一键放行:</span>
            <div class="qrcode-test-container">
              <el-button
                type="success"
                size="small"
                @click="releaseUpload"
                :loading="plcWriteLoading.releaseUpload"
              >
                上货一键放行
              </el-button>
            </div>
          </div>
          <div class="test-section">
            <span class="test-label">小车位置测试:</span>
            <div class="cart-position-test-container">
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车1 (0-1450):</span>
                  <span class="cart-value">{{ cartPositionValues.cart1 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart1"
                    :min="0"
                    :max="1450"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车2 (0-1010):</span>
                  <span class="cart-value">{{ cartPositionValues.cart2 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart2"
                    :min="0"
                    :max="1010"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车3 (0-1010):</span>
                  <span class="cart-value">{{ cartPositionValues.cart3 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart3"
                    :min="0"
                    :max="1010"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车4 (979-2873):</span>
                  <span class="cart-value">{{ cartPositionValues.cart4 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart4"
                    :min="979"
                    :max="2873"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
            </div>
          </div>
          <!-- 添加扫码测试部分 -->
          <div class="test-section">
            <span class="test-label">扫码信息测试:</span>
            <div class="qrcode-test-container">
              <div class="qrcode-input-group">
                <div class="qrcode-label">一楼扫码:</div>
                <el-input
                  v-model="elevatorOneFloorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">二楼扫码:</div>
                <el-input
                  v-model="elevatorTwoFloorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">三楼扫码:</div>
                <el-input
                  v-model="elevatorThreeFloorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">四楼扫码:</div>
                <el-input
                  v-model="elevatorFourFloorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">D灭菌柜扫码:</div>
                <el-input
                  v-model="elevatorDDisinfectionScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">E灭菌柜扫码:</div>
                <el-input
                  v-model="elevatorEDisinfectionScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">一楼缓冲区区扫码:</div>
                <el-input
                  v-model="oneFloorElevatorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-actions">
                <el-button type="primary" size="small" @click="clearAllQrCodes"
                  >清空所有</el-button
                >
              </div>
            </div>
          </div>

          <!-- 添加上位机下发任务测试部分 -->
          <div class="test-section">
            <span class="test-label">上位机下发任务测试:</span>
            <div class="task-test-container">
              <div class="task-buttons">
                <el-button
                  type="primary"
                  size="small"
                  @click="triggerRequestUploadTask"
                >
                  判断去灭/非灭菌 ({{ requestUploadTask }})
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  style="margin-left: 0px"
                  @click="triggerRequestUploadTaskPreheatingCar"
                >
                  预热小车前请求 ({{ requestUploadTaskPreheatingCar }})
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  style="margin-left: 0px"
                  @click="triggerDDisinfectionOutSignal"
                >
                  D出货请求信号 ({{ dDisinfectionOutSignal }})
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  style="margin-left: 0px"
                  @click="triggerEDisinfectionOutSignal"
                >
                  E出货请求信号 ({{ eDisinfectionOutSignal }})
                </el-button>
              </div>
            </div>
          </div>

          <!-- 添加数量控制测试部分 -->
          <div class="test-section">
            <span class="test-label">数量控制测试:</span>
            <div class="quantity-test-container">
              <!-- A线数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">A线数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-label">A1:</span>
                    <span class="quantity-value">{{ aLineQuantity.a1 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('aLineQuantity', 'a1', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('aLineQuantity', 'a1', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">A2:</span>
                    <span class="quantity-value">{{ aLineQuantity.a2 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('aLineQuantity', 'a2', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('aLineQuantity', 'a2', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">A3:</span>
                    <span class="quantity-value">{{ aLineQuantity.a3 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('aLineQuantity', 'a3', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('aLineQuantity', 'a3', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- B线数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">B线数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-label">B1:</span>
                    <span class="quantity-value">{{ bLineQuantity.b1 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('bLineQuantity', 'b1', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('bLineQuantity', 'b1', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">B2:</span>
                    <span class="quantity-value">{{ bLineQuantity.b2 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('bLineQuantity', 'b2', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('bLineQuantity', 'b2', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">B3:</span>
                    <span class="quantity-value">{{ bLineQuantity.b3 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('bLineQuantity', 'b3', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('bLineQuantity', 'b3', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- C线数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">C线数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-label">C1:</span>
                    <span class="quantity-value">{{ cLineQuantity.c1 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('cLineQuantity', 'c1', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('cLineQuantity', 'c1', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">C2:</span>
                    <span class="quantity-value">{{ cLineQuantity.c2 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('cLineQuantity', 'c2', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('cLineQuantity', 'c2', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">C3:</span>
                    <span class="quantity-value">{{ cLineQuantity.c3 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('cLineQuantity', 'c3', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('cLineQuantity', 'c3', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- D进货数量（测试面板可调） -->
              <div class="quantity-group">
                <div class="quantity-title">D进货数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">
                      {{ dDisinfectionInQuantity }}
                    </span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateDInQuantity(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateDInQuantity(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- D出货数量（测试面板可调） -->
              <div class="quantity-group">
                <div class="quantity-title">D出货数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">
                      {{ dDisinfectionOutQuantity }}
                    </span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateDOutQuantity(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateDOutQuantity(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- E进货数量（测试面板可调） -->
              <div class="quantity-group">
                <div class="quantity-title">E进货数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">
                      {{ eDisinfectionInQuantity }}
                    </span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateEInQuantity(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateEInQuantity(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- E出货数量（测试面板可调） -->
              <div class="quantity-group">
                <div class="quantity-title">E出货数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">
                      {{ eDisinfectionOutQuantity }}
                    </span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateEOutQuantity(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateEOutQuantity(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 缓冲区数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">缓冲区数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">{{ bufferQuantity }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateBufferQuantity(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateBufferQuantity(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单查询对话框 -->
    <OrderQueryDialog :visible.sync="orderQueryDialogVisible" />

    <!-- 管理员密码验证对话框 -->
    <el-dialog
      title="管理员权限验证"
      :visible.sync="adminPasswordDialogVisible"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      append-to-body
    >
      <div class="admin-password-content">
        <el-form
          :model="adminPasswordForm"
          :rules="adminPasswordRules"
          ref="adminPasswordForm"
        >
          <el-form-item label="管理员密码" prop="password" label-width="100px">
            <el-input
              v-model="adminPasswordForm.password"
              type="password"
              placeholder="请输入管理员密码"
              show-password
              @keyup.enter.native="verifyAdminPassword"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelAdminPassword">取消</el-button>
        <el-button
          type="primary"
          @click="verifyAdminPassword"
          :loading="adminPasswordLoading"
        >
          验证
        </el-button>
      </div>
    </el-dialog>

    <!-- 托盘检索弹窗 -->
    <el-dialog
      title="托盘检索"
      :visible.sync="traySearchDialogVisible"
      width="821px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="tray-search-form">
        <el-form
          :model="traySearchForm"
          ref="traySearchForm"
          label-width="100px"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="托盘号" prop="trayCode">
                <el-input
                  v-model="traySearchForm.trayCode"
                  placeholder="请输入托盘号进行查询"
                  clearable
                >
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="订单号" prop="orderId">
                <el-input
                  v-model="traySearchForm.orderId"
                  placeholder="请输入订单号进行查询"
                  clearable
                >
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="物料编码" prop="productCode">
                <el-input
                  v-model="traySearchForm.productCode"
                  placeholder="请输入物料编码进行查询"
                  clearable
                >
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="物料名称" prop="productName">
                <el-input
                  v-model="traySearchForm.productName"
                  placeholder="请输入物料名称进行查询"
                  clearable
                >
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 查询结果展示 -->
        <div
          v-if="searchResults && searchResults.length > 0"
          class="search-result"
        >
          <el-divider content-position="left">
            查询结果 (共 {{ searchResults.length }} 个托盘)
          </el-divider>
          <el-table
            :data="searchResults"
            style="width: 100%"
            stripe
            border
            height="300"
            :max-height="300"
          >
            <el-table-column
              prop="trayCode"
              label="托盘号"
              width="180"
              align="center"
            ></el-table-column>
            <el-table-column
              prop="orderId"
              label="订单号"
              width="180"
              align="center"
            >
              <template slot-scope="scope">
                {{ scope.row.orderId || '--' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="productCode"
              label="物料编码"
              width="150"
              align="center"
            >
              <template slot-scope="scope">
                {{ scope.row.productCode || '--' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="productName"
              label="物料名称"
              width="150"
              align="center"
            >
              <template slot-scope="scope">
                {{ scope.row.productName || '--' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="queueName"
              label="当前队列"
              width="120"
              align="center"
            >
              <template slot-scope="scope">
                <span style="color: red; font-weight: bold">{{
                  scope.row.queueName
                }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 无结果提示 -->
        <div
          v-else-if="
            hasSearched && (!searchResults || searchResults.length === 0)
          "
          class="no-result"
        >
          <el-divider content-position="left">查询结果</el-divider>
          <div class="no-result-content">
            <i class="el-icon-warning"></i>
            <p>未找到符合条件的托盘信息</p>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="traySearchDialogVisible = false">关 闭</el-button>
        <el-button type="primary" @click="searchTray" :loading="searchLoading"
          >查 询</el-button
        >
      </div>
    </el-dialog>

    <!-- 添加托盘对话框 -->
    <el-dialog
      title="添加托盘"
      :visible.sync="addTrayDialogVisible"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="add-tray-form">
        <el-form
          :model="newTrayForm"
          ref="newTrayForm"
          label-width="100px"
          :rules="trayFormRules"
        >
          <el-form-item label="托盘编号" prop="trayCode">
            <el-input
              v-model="newTrayForm.trayCode"
              placeholder="请输入托盘编号"
            ></el-input>
          </el-form-item>
          <el-form-item label="批次号" prop="batchId">
            <el-input
              v-model="newTrayForm.batchId"
              placeholder="请输入批次号"
            ></el-input>
          </el-form-item>
          <el-form-item label="是否灭菌" prop="isSterile">
            <el-switch
              v-model="newTrayForm.isSterile"
              active-text="灭菌"
              inactive-text="不灭菌"
              active-color="#13ce66"
              inactive-color="#ff4949"
            >
            </el-switch>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addTrayDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAddTray" :loading="isSubmitting"
          >确 定</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil';
import HttpUtilwms from '@/utils/HttpUtilwms';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import OrderQueryDialog from '@/components/OrderQueryDialog.vue';
export default {
  name: 'MonitorScreen',
  components: {
    OrderQueryDialog
  },
  data() {
    return {
      activePlcGroups: ['1'],
      nowScanTrayInfo: {},
      isDataReady: false, // 添加数据准备就绪标志位
      showTestPanel: false,
      orderQueryDialogVisible: false,
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      activeLogType: 'running',
      runningLogs: [], // 修改为空数组
      alarmLogs: [], // 修改为空数组
      // 小车y轴范围配置
      cartYRanges: {
        cart1: { min: 615, max: 1230 }, // y轴范围615-1230
        cart2: { min: 647, max: 1067 }, // y轴范围647-1067
        cart3: { min: 647, max: 1066 }, // y轴范围647-1066
        cart4: { min: 348, max: 1230 } // y轴范围425-1230
      },
      carts: [
        {
          id: 1,
          name: '小车1',
          x: 790,
          y: 615, // 对应PLC值0的位置（y轴最小值）
          width: 72,
          image: require('@/assets/changzhou-img/cart1.png')
        },
        {
          id: 2,
          name: '小车2',
          x: 1375,
          y: 647, // 对应PLC值0的位置（y轴最小值）
          width: 68,
          image: require('@/assets/changzhou-img/cart2.png')
        },
        {
          id: 3,
          name: '小车3',
          x: 1945,
          y: 647, // 对应PLC值0的位置（y轴最小值）
          width: 72,
          image: require('@/assets/changzhou-img/cart3.png')
        },
        {
          id: 4,
          name: '小车4',
          x: 2510,
          y: 348, // 对应PLC值0的位置（y轴最小值）
          width: 72,
          image: require('@/assets/changzhou-img/cart4.png')
        }
      ],
      nowTrays: [],
      draggedTray: null,
      dragSourceQueue: null,
      isQueueExpanded: false,
      selectedQueueIndex: 0,
      isDragging: false,
      isRefreshing: false,
      addTrayDialogVisible: false,
      // 托盘检索相关
      traySearchDialogVisible: false,
      searchLoading: false,
      traySearchForm: {
        trayCode: '',
        orderId: '',
        productCode: '',
        productName: ''
      },
      searchResults: [],
      hasSearched: false,
      isSubmitting: false,
      newTrayForm: {
        trayCode: '',
        batchId: '',
        isSterile: true
      },
      trayFormRules: {
        trayCode: [
          { required: true, message: '请输入托盘编号', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        batchId: [
          { required: true, message: '请输入批次号', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ]
      },
      queues: [
        {
          id: 1,
          queueName: '上货区',
          trayInfo: []
        },
        {
          id: 2,
          queueName: '分发区',
          trayInfo: []
        },
        {
          id: 3,
          queueName: '缓存区',
          trayInfo: []
        },
        {
          id: 4,
          queueName: 'A1',
          trayInfo: []
        },
        {
          id: 5,
          queueName: 'B1',
          trayInfo: []
        },
        {
          id: 6,
          queueName: 'C1',
          trayInfo: []
        },
        {
          id: 7,
          queueName: 'A2',
          trayInfo: []
        },
        {
          id: 8,
          queueName: 'B2',
          trayInfo: []
        },
        {
          id: 9,
          queueName: 'C2',
          trayInfo: []
        },
        {
          id: 10,
          queueName: 'A3',
          trayInfo: []
        },
        {
          id: 11,
          queueName: 'B3',
          trayInfo: []
        },
        {
          id: 12,
          queueName: 'C3',
          trayInfo: []
        },
        {
          id: 13,
          queueName: 'D进货',
          trayInfo: []
        },
        {
          id: 14,
          queueName: 'E进货',
          trayInfo: []
        },
        {
          id: 15,
          queueName: '非灭菌缓存区',
          trayInfo: []
        },
        {
          id: 16,
          queueName: 'D出货',
          trayInfo: []
        },
        {
          id: 17,
          queueName: 'E出货',
          trayInfo: []
        }
      ],
      // 添加队列位置标识数据
      queueMarkers: [
        { id: 1, name: '上货区', queueId: 1, x: 1325, y: 1350 },
        { id: 2, name: '分发区', queueId: 2, x: 2500, y: 1530 },
        { id: 3, name: '缓冲区', queueId: 3, x: 1325, y: 1230 },
        { id: 4, name: 'A1', queueId: 4, x: 1050, y: 1065 },
        { id: 5, name: 'B1', queueId: 5, x: 1050, y: 845 },
        { id: 6, name: 'C1', queueId: 6, x: 1050, y: 645 },
        { id: 7, name: 'A2', queueId: 7, x: 1610, y: 1065 },
        { id: 8, name: 'B2', queueId: 8, x: 1610, y: 845 },
        { id: 9, name: 'C2', queueId: 9, x: 1610, y: 645 },
        { id: 10, name: 'A3', queueId: 10, x: 2190, y: 1065 },
        { id: 11, name: 'B3', queueId: 11, x: 2190, y: 845 },
        { id: 12, name: 'C3', queueId: 12, x: 2190, y: 645 },
        { id: 13, name: 'D进货', queueId: 13, x: 2070, y: 480 },
        { id: 14, name: 'E进货', queueId: 14, x: 2070, y: 320 },
        { id: 15, name: '非灭菌缓存区', queueId: 15, x: 2630, y: 1280 },
        { id: 16, name: 'D出货', queueId: 16, x: 2210, y: 480 },
        { id: 17, name: 'E出货', queueId: 17, x: 2210, y: 320 }
      ],
      logId: 1000, // 添加一个日志ID计数器
      // 报警点位数据 - 用于监听报警状态变化
      alarmPoints: {
        DBW370: 0, // 提升机相关报警
        DBW372: 0, // 提升机相关报警
        DBW374: 0, // 门安全故障相关报警
        DBW376: 0, // 备用报警点位
        DBW378: 0, // 链条电机相关报警
        DBW380: 0, // 链条电机相关报警
        DBW382: 0, // 链条电机相关报警
        DBW384: 0, // 预热进口小车相关报警
        DBW386: 0, // 预热进口小车相关报警
        DBW388: 0, // A1-1预热相关报警
        DBW390: 0, // B1-1预热相关报警
        DBW392: 0, // C1-1预热相关报警
        DBW394: 0, // 预热出小车相关报警
        DBW396: 0, // 预热出小车相关报警
        DBW398: 0, // A2-1灭菌相关报警
        DBW400: 0, // B2-1灭菌相关报警
        DBW402: 0, // C2-1灭菌相关报警
        DBW404: 0, // 解析进小车相关报警
        DBW406: 0, // 解析进小车相关报警
        DBW408: 0, // A3-1解析相关报警
        DBW410: 0, // B3-1解析相关报警
        DBW412: 0, // C3-1解析相关报警
        DBW414: 0, // 解析出小车相关报警
        DBW416: 0, // 解析出小车相关报警
        DBW418: 0, // 立库对接相关报警
        DBW420: 0, // D柜相关报警
        DBW422: 0 // E柜相关报警
      },
      // 报警点位映射表 - 从报警JSON文件解析而来
      alarmMapping: {
        'DB101.DBW370': {
          bit0: '1楼接货一线滚筒电机启动故障_提升机',
          bit1: '1楼接货一线滚筒电机运行超时_提升机',
          bit2: '1楼接货二线滚筒电机启动故障_提升机',
          bit3: '1楼接货二线滚筒电机运行超时_提升机',
          bit4: '2楼接货一线滚筒电机启动故障_提升机',
          bit5: '2楼接货一线滚筒电机运行超时_提升机',
          bit6: '2楼接货二线滚筒电机启动故障_提升机',
          bit7: '2楼接货二线滚筒电机运行超时_提升机',
          bit8: '3楼接货一线滚筒电机启动故障_提升机',
          bit9: '3楼接货一线滚筒电机运行超时_提升机',
          bit10: '3楼接货二线滚筒电机启动故障_提升机',
          bit11: '3楼接货二线滚筒电机运行超时_提升机',
          bit12: '4楼接货一线滚筒电机启动故障_提升机',
          bit13: '4楼接货一线滚筒电机运行超时_提升机',
          bit14: '4楼接货二线滚筒电机启动故障_提升机',
          bit15: '4楼接货二线滚筒电机运行超时_提升机'
        },
        'DB101.DBW372': {
          bit0: '轿厢滚筒电机启动故障_提升机',
          bit1: '轿厢滚筒电机抱闸启动故障_提升机',
          bit2: '',
          bit3: '轿厢电机运行超时_提升机',
          bit4: '轿厢滚筒变频器故障_提升机',
          bit5: '1楼出货滚筒电机启动故障_提升机',
          bit6: '1楼出货滚筒电机抱闸启动故障_提升机',
          bit7: '1楼出货滚筒电机运行超时_提升机',
          bit8: '1楼出货滚筒变频器故障_提升机',
          bit9: '升降主电机启动故障_提升机',
          bit10: '升降主电机抱闸启动故障_提升机',
          bit11: '升降主电机变频器故障_提升机',
          bit12: '一层下极限位故障',
          bit13: '四层上极限位故障',
          bit14: '配重极限位故障',
          bit15: ''
        },
        'DB101.DBW374': {
          bit0: '一层A口门安全故障',
          bit1: '一层B口门安全故障',
          bit2: '二层门安全故障',
          bit3: '三层门安全故障',
          bit4: '四层门安全故障',
          bit5: '轿厢A安全故障',
          bit6: '轿厢B安全故障',
          bit7: '一层平层检测异常',
          bit8: '二层平层检测异常',
          bit9: '三层平层检测异常',
          bit10: '四层平层检测异常',
          bit11: '轿厢接货停靠错误',
          bit12: '一层急停故障',
          bit13: '二层急停故障',
          bit14: '三层急停故障',
          bit15: '柜门急停故障'
        },
        'DB101.DBW378': {
          bit0: '1#链条电机启动故障',
          bit1: '1#链条运行超时',
          bit2: '1#链条进出货超时',
          bit3: '1#线体数量超限',
          bit4: '2#链条电机启动故障',
          bit5: '2#链条运行超时',
          bit6: '2#链条进出货超时',
          bit7: '2#线体数量超限',
          bit8: '1#辊道电机启动故障',
          bit9: '1#辊道电机运行超时',
          bit10: '1#顶升变频器启动故障',
          bit11: '1#顶升辊道电机运行超时',
          bit12: '1#顶升电机运行超时',
          bit13: '1#顶升变频器故障',
          bit14: '顶升链条电机启动故障',
          bit15: '顶升链条电机运行超时'
        },
        'DB101.DBW380': {
          bit0: '2#顶升变频启动故障',
          bit1: '2#顶升辊道电机运行超时',
          bit2: '2#顶升电机运行超时',
          bit3: '2#顶升变频器故障',
          bit4: '2#辊道电机启动故障',
          bit5: '2#辊道电机运行超时',
          bit6: '容错辊道电机启动故障',
          bit7: '容错辊道电机运行超时',
          bit8: '对接辊道电机启动故障',
          bit9: '对接辊道电机运行超时',
          bit10: '3#链条电机启动故障',
          bit11: '3#链条运行超时',
          bit12: '3#链条进出货超时',
          bit13: '3#线体数量超限',
          bit14: '4#链条电机启动故障',
          bit15: '4#链条运行超时'
        },
        'DB101.DBW382': {
          bit0: '4#链条进出货超时',
          bit1: '4#线体数量超限',
          bit2: '',
          bit3: '',
          bit4: '',
          bit5: '',
          bit6: '',
          bit7: '',
          bit8: '',
          bit9: '',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW384': {
          bit0: '小车数据故障_预热进口小车',
          bit1: '小车行走电机启动故障_预热进口小车',
          bit2: '小车行走电机抱闸启动故障_预热进口小车',
          bit3: '小车输送电机启动故障_预热进口小车',
          bit4: '小车输送电机运行超时故障_预热进口小车',
          bit5: '小车前进接货停靠故障_预热进口小车',
          bit6: '小车前进送货停靠故障_预热进口小车',
          bit7: '小车后退接货停靠故障_预热进口小车',
          bit8: '小车后退送货停靠故障_预热进口小车',
          bit9: '小车暂停故障_预热进口小车',
          bit10: '小车前极限故障_预热进口小车',
          bit11: '小车后极限故障_预热进口小车',
          bit12: '小车进口安全故障_预热进口小车',
          bit13: '小车出口安全故障_预热进口小车',
          bit14: '小车进货超限_预热进口小车',
          bit15: '小车接送货停靠位置异常_预热进口小车'
        },
        'DB101.DBW386': {
          bit0: '小车行走变频器故障_预热进口小车',
          bit1: '',
          bit2: '',
          bit3: '',
          bit4: '',
          bit5: '',
          bit6: '',
          bit7: '',
          bit8: '',
          bit9: '',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW388': {
          bit0: '电机启动故障_A1-1预热',
          bit1: '电机运行故障_A1-1预热',
          bit2: '自动进出货运行超时故障_A1-1预热',
          bit3: '线体数量超限_A1-1预热',
          bit4: '急停故障_A1-1预热',
          bit5: '电机启动故障_A1-2预热',
          bit6: '电机运行故障_A1-2预热',
          bit7: '自动进出货运行超时故障_A1-2预热',
          bit8: '线体数量超限_A1-2预热',
          bit9: '急停故障_A1-2预热',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW390': {
          bit0: '电机启动故障_B1-1预热',
          bit1: '电机运行故障_B1-1预热',
          bit2: '自动进出货运行超时故障_B1-1预热',
          bit3: '线体数量超限_B1-1预热',
          bit4: '急停故障_B1-1预热',
          bit5: '电机启动故障_B1-2预热',
          bit6: '电机运行故障_B1-2预热',
          bit7: '自动进出货运行超时故障_B1-2预热',
          bit8: '线体数量超限_B1-2预热',
          bit9: '急停故障_B1-2预热',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW392': {
          bit0: '电机启动故障_C1-1预热',
          bit1: '电机运行故障_C1-1预热',
          bit2: '自动进出货运行超时故障_C1-1预热',
          bit3: '线体数量超限_C1-1预热',
          bit4: '急停故障_C1-1预热',
          bit5: '电机启动故障_C1-2预热',
          bit6: '电机启动故障_C1-2预热',
          bit7: '自动进出货运行超时故障_C1-2预热',
          bit8: '线体数量超限_C1-2预热',
          bit9: '急停故障_C1-2预热',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW394': {
          bit0: '小车数据故障_预热出小车',
          bit1: '小车行走电机启动故障_预热出小车',
          bit2: '小车行走电机抱闸启动故障_预热出小车',
          bit3: '小车输送1#电机启动故障_预热出小车',
          bit4: '小车输送1#电机运行超时故障_预热出小车',
          bit5: '小车输送2#电机启动故障_预热出小车',
          bit6: '小车输送2#电机运行超时故障_预热出小车',
          bit7: '小车前进接货停靠故障_预热出小车',
          bit8: '小车前进送货停靠故障_预热出小车',
          bit9: '小车后退接货停靠故障_预热出小车',
          bit10: '小车后退送货停靠故障_预热出小车',
          bit11: '小车暂停故障_预热出小车',
          bit12: '小车前极限故障_预热出小车',
          bit13: '小车后极限故障_预热出小车',
          bit14: '小车进口安全故障_预热出小车',
          bit15: '小车出口安全故障_预热出小车'
        },
        'DB101.DBW396': {
          bit0: '小车1#线进货超限_预热出小车',
          bit1: '小车2#线进货超限_预热出小车',
          bit2: '小车接送货停靠位置异常_预热出小车',
          bit3: '小车变频器故障_预热出小车',
          bit4: '',
          bit5: '',
          bit6: '',
          bit7: '',
          bit8: '',
          bit9: '',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW398': {
          bit0: '电机启动故障_A2-1灭菌',
          bit1: '电机运行故障_A2-1灭菌',
          bit2: '自动进出货运行超时故障_A2-1灭菌',
          bit3: '线体数量超限_A2-1灭菌',
          bit4: '急停故障_A2-1灭菌',
          bit5: '电机启动故障_A2-2灭菌',
          bit6: '电机启动故障_A2-2灭菌',
          bit7: '自动进出货运行超时故障_A2-2灭菌',
          bit8: '线体数量超限_A2-2灭菌',
          bit9: '急停故障_A2-2灭菌',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW400': {
          bit0: '电机启动故障_B2-1灭菌',
          bit1: '电机运行故障_B2-1灭菌',
          bit2: '自动进出货运行超时故障_B2-1灭菌',
          bit3: '线体数量超限_B2-1灭菌',
          bit4: '急停故障_B2-1灭菌',
          bit5: '电机启动故障_B2-2灭菌',
          bit6: '电机启动故障_B2-2灭菌',
          bit7: '自动进出货运行超时故障_B2-2灭菌',
          bit8: '线体数量超限_B2-2灭菌',
          bit9: '急停故障_B2-2灭菌',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW402': {
          bit0: '电机启动故障_C2-1灭菌',
          bit1: '电机运行故障_C2-1灭菌',
          bit2: '自动进出货运行超时故障_C2-1灭菌',
          bit3: '线体数量超限_C2-1灭菌',
          bit4: '急停故障_C2-1灭菌',
          bit5: '电机启动故障_C2-2灭菌',
          bit6: '电机启动故障_C2-2灭菌',
          bit7: '自动进出货运行超时故障_C2-2灭菌',
          bit8: '线体数量超限_C2-2灭菌',
          bit9: '急停故障_C2-2灭菌',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW404': {
          bit0: '小车数据故障_解析进小车',
          bit1: '小车行走电机启动故障_解析进小车',
          bit2: '小车行走电机抱闸启动故障_解析进小车',
          bit3: '小车输送1#电机启动故障_解析进小车',
          bit4: '小车输送1#电机运行超时故障_解析进小车',
          bit5: '小车输送2#电机启动故障_解析进小车',
          bit6: '小车输送2#电机运行超时故障_解析进小车',
          bit7: '小车前进接货停靠故障_解析进小车',
          bit8: '小车前进送货停靠故障_解析进小车',
          bit9: '小车后退接货停靠故障_解析进小车',
          bit10: '小车后退送货停靠故障_解析进小车',
          bit11: '小车暂停故障_解析进小车',
          bit12: '小车前极限故障_解析进小车',
          bit13: '小车后极限故障_解析进小车',
          bit14: '小车进口安全故障_解析进小车',
          bit15: '小车出口安全故障_解析进小车'
        },
        'DB101.DBW406': {
          bit0: '小车1#线进货超限_解析进小车',
          bit1: '小车2#线进货超限_解析进小车',
          bit2: '小车接送货停靠位置异常_解析进小车',
          bit3: '小车行走变频器故障_解析进小车',
          bit4: '',
          bit5: '',
          bit6: '',
          bit7: '',
          bit8: '',
          bit9: '',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW408': {
          bit0: '电机启动故障_A3-1解析',
          bit1: '电机运行故障_A3-1解析',
          bit2: '自动进出货运行超时故障_A3-1解析',
          bit3: '线体数量超限_A3-1解析',
          bit4: '急停故障_A3-1解析',
          bit5: '电机启动故障_A3-2解析',
          bit6: '电机启动故障_A3-2解析',
          bit7: '自动进出货运行超时故障_A3-2解析',
          bit8: '线体数量超限_A3-2解析',
          bit9: '急停故障_A3-2解析',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW410': {
          bit0: '电机启动故障_B3-1解析',
          bit1: '电机运行故障_B3-1解析',
          bit2: '自动进出货运行超时故障_B3-1解析',
          bit3: '线体数量超限_B3-1解析',
          bit4: '急停故障_B3-1解析',
          bit5: '电机启动故障_B3-2解析',
          bit6: '电机启动故障_B3-2解析',
          bit7: '自动进出货运行超时故障_B3-2解析',
          bit8: '线体数量超限_B3-2解析',
          bit9: '急停故障_B3-2解析',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW412': {
          bit0: '电机启动故障_C3-1解析',
          bit1: '电机运行故障_C3-1解析',
          bit2: '自动进出货运行超时故障_C3-1解析',
          bit3: '线体数量超限_C3-1解析',
          bit4: '急停故障_C3-1解析',
          bit5: '电机启动故障_C3-2解析',
          bit6: '电机启动故障_C3-2解析',
          bit7: '自动进出货运行超时故障_C3-2解析',
          bit8: '线体数量超限_C3-2解析',
          bit9: '急停故障_C3-2解析',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW414': {
          bit0: '小车数据故障_解析出小车',
          bit1: '小车行走电机启动故障_解析出小车',
          bit2: '小车行走电机抱闸启动故障_解析出小车',
          bit3: '小车输送1#电机启动故障_解析出小车',
          bit4: '小车输送1#电机运行超时故障_解析出小车',
          bit5: '小车输送2#电机启动故障_解析出小车',
          bit6: '小车输送2#电机运行超时故障_解析出小车',
          bit7: '小车前进接货停靠故障_解析出小车',
          bit8: '小车前进送货停靠故障_解析出小车',
          bit9: '小车后退接货停靠故障_解析出小车',
          bit10: '小车后退送货停靠故障_解析出小车',
          bit11: '小车暂停故障_解析出小车',
          bit12: '小车前极限故障_解析出小车',
          bit13: '小车后极限故障_解析出小车',
          bit14: '小车进口安全故障_解析出小车',
          bit15: '小车出口安全故障_解析出小车'
        },
        'DB101.DBW416': {
          bit0: '小车1#线进货超限_解析出小车',
          bit1: '小车2#线进货超限_解析出小车',
          bit2: '小车接送货停靠位置异常_解析出小车',
          bit3: '小车行走变频器故障_解析出小车',
          bit4: '',
          bit5: '',
          bit6: '',
          bit7: '',
          bit8: '',
          bit9: '',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW418': {
          bit0: '电机启动故障_立库对接1线',
          bit1: '电机运行故障_立库对接1线',
          bit2: '自动进出货运行超时故障_立库对接1线',
          bit3: '急停故障_立库对接1线',
          bit4: '电机启动故障_立库对接2线',
          bit5: '电机运行故障_立库对接2线',
          bit6: '自动进出货运行超时故障_立库对接2线',
          bit7: '急停故障_立库对接2线',
          bit8: '',
          bit9: '',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW420': {
          bit0: 'D柜上线输送电机启动故障',
          bit1: 'D柜上线输送电机运行超时',
          bit2: 'D柜上线气缸升降运行超时',
          bit3: 'D柜上线气缸推盘运行超时',
          bit4: 'D柜下线输送电机启动故障',
          bit5: 'D柜下线输送电机运行超时',
          bit6: '',
          bit7: '',
          bit8: '',
          bit9: '',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        },
        'DB101.DBW422': {
          bit0: 'E柜上线输送电机启动故障',
          bit1: 'E柜上线输送电机运行超时',
          bit2: 'E柜上线气缸升降运行超时',
          bit3: 'E柜上线气缸推盘运行超时',
          bit4: 'E柜下线输送电机启动故障',
          bit5: 'E柜下线输送电机运行超时',
          bit6: '',
          bit7: '',
          bit8: '',
          bit9: '',
          bit10: '',
          bit11: '',
          bit12: '',
          bit13: '',
          bit14: '',
          bit15: ''
        }
      },
      // 输送线当前运行状态-读取PLC
      conveyorStatus: '',
      // 允许进料反馈-读取PLC
      allowFeedBack: {
        bit0: '0', // 值为1时，全部接货口不允许进货
        bit1: '0', // 值为1时，一楼接货口允许进货；值为0时，不允许
        bit2: '0', // 值为1时，二楼1#接货口允许进货；值为0时，不允许
        bit3: '0', // 值为1时，二楼2#接货口允许进货；值为0时，不允许
        bit4: '0', // 值为1时，三楼1#接货口允许进货；值为0时，不允许
        bit5: '0' // 值为1时，三楼2#接货口允许进货；值为0时，不允许
      },
      // A线电机运行信号-读取PLC
      aLineMotorRunning: {
        bit0: '0', // A1-1#电机运行信号
        bit1: '0', // A1-2#电机运行信号
        bit2: '0', // A2-1#电机运行信号
        bit3: '0', // A2-2#电机运行信号
        bit4: '0', // A3-1#电机运行信号
        bit5: '0' // A3-2#电机运行信号
      },
      // A线光电检测信号-读取PLC
      aLinePhotoelectricSignal: {
        bit0: '0', // A-1#光电
        bit1: '0', // A-2#光电
        bit2: '0', // A-3#光电
        bit3: '0', // A-4#光电
        bit4: '0', // A-5#光电
        bit5: '0', // A-6#光电
        bit6: '0', // A-7#光电
        bit7: '0', // A-8#光电
        bit8: '0', // A-9#光电
        bit9: '0' // A-10#光电
      },
      // B线电机运行信号-读取PLC
      bLineMotorRunning: {
        bit0: '0', // B1-1#电机运行信号
        bit1: '0', // B1-2#电机运行信号
        bit2: '0', // B2-1#电机运行信号
        bit3: '0', // B2-2#电机运行信号
        bit4: '0', // B3-1#电机运行信号
        bit5: '0' // B3-2#电机运行信号
      },
      // B线光电检测信号-读取PLC
      bLinePhotoelectricSignal: {
        bit0: '0', // B-1#光电
        bit1: '0', // B-2#光电
        bit2: '0', // B-3#光电
        bit3: '0', // B-4#光电
        bit4: '0', // B-5#光电
        bit5: '0', // B-6#光电
        bit6: '0', // B-7#光电
        bit7: '0', // B-8#光电
        bit8: '0', // B-9#光电
        bit9: '0' // B-10#光电
      },
      // C线电机运行信号-读取PLC
      cLineMotorRunning: {
        bit0: '0', // C1-1#电机运行信号
        bit1: '0', // C1-2#电机运行信号
        bit2: '0', // C2-1#电机运行信号
        bit3: '0', // C2-2#电机运行信号
        bit4: '0', // C3-1#电机运行信号
        bit5: '0' // C3-2#电机运行信号
      },
      // C线光电检测信号-读取PLC
      cLinePhotoelectricSignal: {
        bit0: '0', // C-1#光电
        bit1: '0', // C-2#光电
        bit2: '0', // C-3#光电
        bit3: '0', // C-4#光电
        bit4: '0', // C-5#光电
        bit5: '0', // C-6#光电
        bit6: '0', // C-7#光电
        bit7: '0', // C-8#光电
        bit8: '0', // C-9#光电
        bit9: '0' // C-10#光电
      },
      // D线电机运行信号-读取PLC
      dLineMotorRunning: {
        bit0: '0', // D1-1#电机运行信号
        bit1: '0' // D1-2#电机运行信号
      },
      // D线光电检测信号-读取PLC
      dLinePhotoelectricSignal: {
        bit0: '0', // D-1#光电
        bit1: '0', // D-2#光电
        bit2: '0', // D-3#光电
        bit3: '0', // D-4#光电
        bit4: '0' // D-5#光电
      },
      // E线电机运行信号-读取PLC
      eLineMotorRunning: {
        bit0: '0', // E1-1#电机运行信号
        bit1: '0' // E1-2#电机运行信号
      },
      // E线光电检测信号-读取PLC
      eLinePhotoelectricSignal: {
        bit0: '0', // E-1#光电
        bit1: '0', // E-2#光电
        bit2: '0', // E-3#光电
        bit3: '0', // E-4#光电
        bit4: '0' // E-5#光电
      },
      // 输送线故障反馈-读取PLC
      conveyorFaultFeedback: {
        bit0: '0', // A1预热故障
        bit1: '0', // A2灭菌故障
        bit2: '0', // A3解析故障
        bit3: '0', // B1预热故障
        bit4: '0', // B2灭菌故障
        bit5: '0', // B3解析故障
        bit6: '0', // C1预热故障
        bit7: '0', // C2灭菌故障
        bit8: '0', // C3解析故障
        bit9: '0', // D灭菌故障
        bit10: '0', // E灭菌故障
        bit11: '0', // 提升机故障
        bit12: '0', // 1#小车故障
        bit13: '0', // 2#小车故障
        bit14: '0', // 3#小车故障
        bit15: '0' // 主柜急停
      },
      // A线数量-读取PLC
      aLineQuantity: {
        a1: 0,
        a2: 0,
        a3: 0
      },
      // B线数量-读取PLC
      bLineQuantity: {
        b1: 0,
        b2: 0,
        b3: 0
      },
      // C线数量-读取PLC
      cLineQuantity: {
        c1: 0,
        c2: 0,
        c3: 0
      },
      // 缓冲区数量
      bufferQuantity: 0,
      dDisinfectionInQuantity: 0,
      eDisinfectionInQuantity: 0,
      dDisinfectionOutQuantity: 0,
      eDisinfectionOutQuantity: 0,
      dDisinfectionOutSignal: 0,
      eDisinfectionOutSignal: 0,
      // 非灭菌下货区数量-读取PLC
      nonSterileunload: 0,
      //上货区电机运行信号（扫码后入队）-读取PLC
      upLoadMotorRunning: {
        bit0: '0', // S1#电机运行信号
        bit1: '0', // S2#电机运行信号
        bit2: '0', // S3#电机运行信号
        bit3: '0', // S4#电机运行信号
        bit4: '0', // S5#电机运行信号
        bit5: '0', // S6#电机运行信号
        bit6: '0', // S7#电机运行信号
        bit7: '0', // S8#电机运行信号
        bit8: '0', // S9#电机运行信号
        bit9: '0', // S10#电机运行信号
        bit10: '0', // S11#电机运行信号
        bit11: '0' // S12#电机运行信号
      },
      // 上货区输送线光电信号-读取PLC
      upLoadPhotoelectricSignal: {
        bit0: '0', // S-1#光电
        bit1: '0', // S-2#光电
        bit2: '0', // S-3#光电
        bit3: '0', // S-4#光电
        bit4: '0', // S-5#光电
        bit5: '0', // S-6#光电
        bit6: '0', // S-7#光电
        bit7: '0', // S-8#光电
        bit8: '0', // S-9#光电
        bit9: '0', // S-10#光电
        bit10: '0', // S-11#光电
        bit11: '0', // S-12#光电
        bit12: '0', // S-13#光电
        bit13: '0' // S-14#光电
      },
      // 小车位置数值-读取PLC
      cartPositionValues: {
        cart1: 0, // DBW88, 范围0-1450
        cart2: 0, // DBW90, 范围0-1010
        cart3: 0, // DBW92, 范围0-1010
        cart4: 979 // DBW94, 范围979-2873
      },
      // 扫码枪处光电信号-读取PLC
      scanPhotoelectricSignal: {
        bit0: '0', // 一楼接货站台"有载信号"/光电占位
        bit1: '0', // 一楼缓存区（扫码后入队或者去立库）处"有载信号"/光电占位
        bit2: '0', // 二楼接货占位"有载信号"/光电占位
        bit3: '0', // 无解释
        bit4: '0', // 三楼接货占位"有载信号"/光电占位
        bit5: '0', // 四楼接货占位"有载信号"/光电占位
        bit6: '0', // 进预热处"扫码枪处"有载信号"/光电占位
        bit7: '0', // 一楼D灭菌"有载信号"/光电占位
        bit8: '0' // 一楼E灭菌"有载信号"/光电占位
      },
      // 请求上位机下发任务(判断去灭菌还是非灭菌）
      requestUploadTask: 0,
      // 请求上位机下发任务(预热小车前）
      requestUploadTaskPreheatingCar: 0,
      // 提升机一楼接货站台扫码数据（托盘号）
      elevatorOneFloorScanCode: '',
      // 一楼顶升移栽区扫码数据（扫码后判断方向）（托盘号）
      oneFloorElevatorScanCode: '',
      // 提升机二楼接货站台扫码数据（托盘号）
      elevatorTwoFloorScanCode: '',
      // 提升机三楼接货站台扫码数据（托盘号）
      elevatorThreeFloorScanCode: '',
      // 提升机四楼接货站台扫码数据（托盘号）
      elevatorFourFloorScanCode: '',
      // 一楼D灭菌柜接货站台扫码数据（托盘号）
      elevatorDDisinfectionScanCode: '',
      // 一楼E灭菌柜接货站台扫码数据（托盘号）
      elevatorEDisinfectionScanCode: '',
      // PLC变量写入测试值
      plcWriteValues: {
        inboundLine1: '',
        inboundLine2: '',
        bufferLine1: '',
        bufferLine2: '',
        bufferCount: '',
        // A线
        a1Preheat1: '',
        a1Preheat2: '',
        a2Sterile1: '',
        a2Sterile2: '',
        a3Analysis1: '',
        a3Analysis2: '',
        // B线
        b1Preheat1: '',
        b1Preheat2: '',
        b2Sterile1: '',
        b2Sterile2: '',
        b3Analysis1: '',
        b3Analysis2: '',
        // C线
        c1Preheat1: '',
        c1Preheat2: '',
        c2Sterile1: '',
        c2Sterile2: '',
        c3Analysis1: '',
        c3Analysis2: '',
        // D\E线
        dSterileIn: '',
        dSterileOut: '',
        eSterileIn: '',
        eSterileOut: ''
      },
      // PLC写入loading状态
      plcWriteLoading: {
        inboundLine1: false,
        inboundLine2: false,
        bufferLine1: false,
        bufferLine2: false,
        bufferCount: false,
        // A线
        a1Preheat1: false,
        a1Preheat2: false,
        a2Sterile1: false,
        a2Sterile2: false,
        a3Analysis1: false,
        a3Analysis2: false,
        // B线
        b1Preheat1: false,
        b1Preheat2: false,
        b2Sterile1: false,
        b2Sterile2: false,
        b3Analysis1: false,
        b3Analysis2: false,
        // C线
        c1Preheat1: false,
        c1Preheat2: false,
        c2Sterile1: false,
        c2Sterile2: false,
        c3Analysis1: false,
        c3Analysis2: false,
        // D\E线
        dSterileIn: false,
        dSterileOut: false,
        eSterileIn: false,
        eSterileOut: false,
        releaseUpload: false
      },
      // 添加复选框状态-一楼允许上货
      allowUploadOne: false,
      // 添加复选框状态-一楼是否非灭菌（默认灭菌）
      nonSterileOne: false,
      // 添加复选框状态-二楼允许上货
      allowUploadTwo: false,
      // 添加复选框状态-二楼是否非灭菌（默认灭菌）
      nonSterileTwo: false,
      // 添加复选框状态-三楼允许上货
      allowUploadThree: false,
      // 添加复选框状态-三楼是否非灭菌（默认灭菌）
      nonSterileThree: false,
      // 添加复选框状态-四楼允许上货
      allowUploadFour: false,
      // 添加复选框状态-四楼是否非灭菌（默认灭菌）
      nonSterileFour: false,
      // 添加复选框状态-D灭菌柜允许上货
      allowUploadD: false,
      // 添加复选框状态-D灭菌柜是否非灭菌（默认灭菌）
      nonSterileD: false,
      // 添加复选框状态-E灭菌柜允许上货
      allowUploadE: false,
      // 添加复选框状态-E灭菌柜是否非灭菌（默认灭菌）
      nonSterileE: false,
      // 显示小车1设置去哪个预热房的按钮
      showCar1SetPreheatingRoom: false,
      // 显示小车设置去哪个预热房的按钮
      preheatingRoomSelected: '',
      // 灭菌出发地
      disinfectionRoomSelectedFrom: '',
      // 灭菌目的地
      disinfectionRoomSelectedTo: '',
      // 立库出发地
      warehouseSelectedFrom: '',
      // 立库目的地
      warehouseSelectedTo: '',
      // 出库选择
      outWarehouseSelected: '',
      // 当前出库托盘数据
      currentOutTrayInfo: {
        trayCode: '',
        productName: '',
        isTerile: ''
      },
      // 正在执行的预热托盘号
      preWarmTrayCode: '',
      // 正在执行出库的预热托盘号
      disinfectionTrayCode: '',
      // 正在执行出库的解析托盘号
      analysisTrayCode: '',
      // 正在执行的出库托盘号
      outWarehouseTrayCode: '',
      // 无码上货模式开关
      noCodeUpload: false,
      // 预热执行与显示
      preheatExecQty: undefined,
      preheatExecuting: false,
      preheatNeedQty: 0,
      // 预热到灭菌执行状态
      disinfectionExecuting: false,
      // 预热到灭菌的目标总数量（起始地队列数量+目的地已有队列数量）
      disinfectionTargetTotal: 0,
      // 灭菌到解析执行状态
      analysisExecuting: false,
      // 灭菌到解析的目标总数量（起始地队列数量+目的地已有队列数量）
      analysisTargetTotal: 0,
      // 出库执行状态
      outWarehouseExecuting: false,
      // 灭菌、解析、出库显示
      disinfectionNeedQty: 0,
      analysisNeedQty: 0,
      outNeedQty: 0,
      // D/E 执行与显示
      dExecQty: undefined,
      dExecuting: false,
      dNeedQty: 0,
      eExecQty: undefined,
      eExecuting: false,
      eNeedQty: 0,
      // 四个主要功能的loading状态
      preheatingRoomLoading: false,
      disinfectionRoomLoading: false,
      analysisRoomLoading: false,
      outWarehouseLoading: false,
      // 管理员密码验证相关
      adminPasswordDialogVisible: false,
      adminPasswordLoading: false,
      adminPasswordForm: {
        password: ''
      },
      adminPasswordRules: {
        password: [
          { required: true, message: '请输入管理员密码', trigger: 'blur' }
        ]
      },
      // 当前要修改的非灭菌复选框信息
      currentNonSterileCheckbox: null,
      // 当前操作类型
      currentOperation: null,
      // 上货1数量-读取PLC
      upLoad1Quantity: 0,
      // 上货2数量-读取PLC
      upLoad2Quantity: 0,
      // 缓存区1数量-读取PLC
      buffer1Quantity: 0,
      // 缓存区2数量-读取PLC
      buffer2Quantity: 0,
      // 预热、灭菌、解析柜状态-读取PLC
      preheatingDisinfectionAnalysisState: {
        bit0: '0', // A1预热完成
        bit1: '0', // A2灭菌完成
        bit2: '0', // A3解析完成
        bit3: '0', // B1预热完成
        bit4: '0', // B2灭菌完成
        bit5: '0', // B3解析完成
        bit6: '0', // C1预热完成
        bit7: '0', // C2灭菌完成
        bit8: '0' // C3解析完成
      }
    };
  },
  computed: {
    currentLogs() {
      return this.activeLogType === 'running'
        ? this.runningLogs
        : this.alarmLogs;
    },
    unreadAlarms() {
      return this.alarmLogs.filter((log) => log.unread).length;
    },
    filteredQueues() {
      return this.queues.filter((q) => q.id !== 15);
    },
    selectedQueue() {
      return this.queues[this.selectedQueueIndex];
    }
  },
  mounted() {
    this.initializeMarkers();
    this.loadQueueInfoFromDatabase();
    ipcRenderer.on('receivedMsg', (event, values, values2) => {
      // 使用位运算优化赋值
      const getBit = (word, bitIndex) => ((word >> bitIndex) & 1).toString();

      // 允许进料反馈
      let word4 = this.convertToWord(values.DBW4);
      this.allowFeedBack.bit0 = getBit(word4, 8);
      this.allowFeedBack.bit1 = getBit(word4, 9);
      this.allowFeedBack.bit2 = getBit(word4, 10);
      this.allowFeedBack.bit3 = getBit(word4, 11);
      this.allowFeedBack.bit4 = getBit(word4, 12);
      this.allowFeedBack.bit5 = getBit(word4, 13);

      // A线电机运行信号 (DBW6)
      let word6 = this.convertToWord(values.DBW6);
      this.aLineMotorRunning.bit0 = getBit(word6, 8);
      this.aLineMotorRunning.bit1 = getBit(word6, 9);
      this.aLineMotorRunning.bit2 = getBit(word6, 10);
      this.aLineMotorRunning.bit3 = getBit(word6, 11);
      this.aLineMotorRunning.bit4 = getBit(word6, 12);
      this.aLineMotorRunning.bit5 = getBit(word6, 13);

      // A线光电检测信号 (DBW8)
      let word8 = this.convertToWord(values.DBW8);
      this.aLinePhotoelectricSignal.bit0 = getBit(word8, 8);
      this.aLinePhotoelectricSignal.bit1 = getBit(word8, 9);
      this.aLinePhotoelectricSignal.bit2 = getBit(word8, 10);
      this.aLinePhotoelectricSignal.bit3 = getBit(word8, 11);
      this.aLinePhotoelectricSignal.bit4 = getBit(word8, 12);
      this.aLinePhotoelectricSignal.bit5 = getBit(word8, 13);
      this.aLinePhotoelectricSignal.bit6 = getBit(word8, 14);
      this.aLinePhotoelectricSignal.bit7 = getBit(word8, 15);
      this.aLinePhotoelectricSignal.bit8 = getBit(word8, 0);
      this.aLinePhotoelectricSignal.bit9 = getBit(word8, 1);

      // B线电机运行信号 (DBW10)
      let word10 = this.convertToWord(values.DBW10);
      this.bLineMotorRunning.bit0 = getBit(word10, 8);
      this.bLineMotorRunning.bit1 = getBit(word10, 9);
      this.bLineMotorRunning.bit2 = getBit(word10, 10);
      this.bLineMotorRunning.bit3 = getBit(word10, 11);
      this.bLineMotorRunning.bit4 = getBit(word10, 12);
      this.bLineMotorRunning.bit5 = getBit(word10, 13);

      // B线光电检测信号 (DBW12)
      let word12 = this.convertToWord(values.DBW12);
      this.bLinePhotoelectricSignal.bit0 = getBit(word12, 8);
      this.bLinePhotoelectricSignal.bit1 = getBit(word12, 9);
      this.bLinePhotoelectricSignal.bit2 = getBit(word12, 10);
      this.bLinePhotoelectricSignal.bit3 = getBit(word12, 11);
      this.bLinePhotoelectricSignal.bit4 = getBit(word12, 12);
      this.bLinePhotoelectricSignal.bit5 = getBit(word12, 13);
      this.bLinePhotoelectricSignal.bit6 = getBit(word12, 14);
      this.bLinePhotoelectricSignal.bit7 = getBit(word12, 15);
      this.bLinePhotoelectricSignal.bit8 = getBit(word12, 0);
      this.bLinePhotoelectricSignal.bit9 = getBit(word12, 1);

      // C线电机运行信号 (DBW14)
      let word14 = this.convertToWord(values.DBW14);
      this.cLineMotorRunning.bit0 = getBit(word14, 8);
      this.cLineMotorRunning.bit1 = getBit(word14, 9);
      this.cLineMotorRunning.bit2 = getBit(word14, 10);
      this.cLineMotorRunning.bit3 = getBit(word14, 11);
      this.cLineMotorRunning.bit4 = getBit(word14, 12);
      this.cLineMotorRunning.bit5 = getBit(word14, 13);

      // C线光电检测信号 (DBW16)
      let word16 = this.convertToWord(values.DBW16);
      this.cLinePhotoelectricSignal.bit0 = getBit(word16, 8);
      this.cLinePhotoelectricSignal.bit1 = getBit(word16, 9);
      this.cLinePhotoelectricSignal.bit2 = getBit(word16, 10);
      this.cLinePhotoelectricSignal.bit3 = getBit(word16, 11);
      this.cLinePhotoelectricSignal.bit4 = getBit(word16, 12);
      this.cLinePhotoelectricSignal.bit5 = getBit(word16, 13);
      this.cLinePhotoelectricSignal.bit6 = getBit(word16, 14);
      this.cLinePhotoelectricSignal.bit7 = getBit(word16, 15);
      this.cLinePhotoelectricSignal.bit8 = getBit(word16, 0);
      this.cLinePhotoelectricSignal.bit9 = getBit(word16, 1);

      // D线电机运行信号-读取PLC
      let word18 = this.convertToWord(values.DBW18);
      this.dLineMotorRunning.bit0 = getBit(word18, 8);
      this.dLineMotorRunning.bit1 = getBit(word18, 9);

      // D线光电检测信号-读取PLC
      let word20 = this.convertToWord(values.DBW20);
      this.dLinePhotoelectricSignal.bit1 = getBit(word20, 9);
      this.dLinePhotoelectricSignal.bit2 = getBit(word20, 10);
      this.dLinePhotoelectricSignal.bit3 = getBit(word20, 11);
      this.dLinePhotoelectricSignal.bit4 = getBit(word20, 12);

      // E线电机运行信号-读取PLC
      let word22 = this.convertToWord(values.DBW22);
      this.eLineMotorRunning.bit0 = getBit(word22, 8);
      this.eLineMotorRunning.bit1 = getBit(word22, 9);

      // E线光电检测信号-读取PLC
      let word24 = this.convertToWord(values.DBW24);
      this.eLinePhotoelectricSignal.bit1 = getBit(word24, 9);
      this.eLinePhotoelectricSignal.bit2 = getBit(word24, 10);
      this.eLinePhotoelectricSignal.bit3 = getBit(word24, 11);
      this.eLinePhotoelectricSignal.bit4 = getBit(word24, 12);

      // 缓冲区数量-读取PLC
      this.bufferQuantity = Number(values.DBW28);

      // 请求上位机下发任务(判断去灭菌还是非灭菌）
      this.requestUploadTask = Number(values.DBW30);

      // A线数量-读取PLC
      this.aLineQuantity.a1 = Number(values.DBW34);
      this.aLineQuantity.a2 = Number(values.DBW36);
      this.aLineQuantity.a3 = Number(values.DBW38);

      // B线数量-读取PLC
      this.bLineQuantity.b1 = Number(values.DBW40);
      this.bLineQuantity.b2 = Number(values.DBW42);
      this.bLineQuantity.b3 = Number(values.DBW44);

      // C线数量-读取PLC
      this.cLineQuantity.c1 = Number(values.DBW46);
      this.cLineQuantity.c2 = Number(values.DBW48);
      this.cLineQuantity.c3 = Number(values.DBW50);
      // D灭菌柜进货数量-读取PLC
      this.dDisinfectionInQuantity = Number(values.DBW52);
      // D灭菌柜出货数量-读取PLC
      this.dDisinfectionOutQuantity = Number(values.DBW54);
      // D灭菌柜请求出货信号-读取PLC
      this.dDisinfectionOutSignal = Number(values.DBW56);
      // E灭菌柜进货数量-读取PLC
      this.eDisinfectionInQuantity = Number(values.DBW58);
      // E灭菌柜出货数量-读取PLC
      this.eDisinfectionOutQuantity = Number(values.DBW60);
      // E灭菌柜请求出货信号-读取PLC
      this.eDisinfectionOutSignal = Number(values.DBW62);
      // 非灭菌区数量-读取PLC
      this.nonSterileunload = Number(values.DBW32);
      // 上货区电机运行信号（扫码后入队） (DBW64)
      let word64 = this.convertToWord(values.DBW64);
      this.upLoadMotorRunning.bit0 = getBit(word64, 8);
      this.upLoadMotorRunning.bit1 = getBit(word64, 9);
      this.upLoadMotorRunning.bit2 = getBit(word64, 10);
      this.upLoadMotorRunning.bit3 = getBit(word64, 11);
      this.upLoadMotorRunning.bit4 = getBit(word64, 12);
      this.upLoadMotorRunning.bit5 = getBit(word64, 13);
      this.upLoadMotorRunning.bit6 = getBit(word64, 14);
      this.upLoadMotorRunning.bit7 = getBit(word64, 15);
      this.upLoadMotorRunning.bit8 = getBit(word64, 0);
      this.upLoadMotorRunning.bit9 = getBit(word64, 1);
      this.upLoadMotorRunning.bit10 = getBit(word64, 2);

      //上货区输送线光电信号 (DBW66)
      let word66 = this.convertToWord(values.DBW66);
      this.upLoadPhotoelectricSignal.bit0 = getBit(word66, 8);
      this.upLoadPhotoelectricSignal.bit1 = getBit(word66, 9);
      this.upLoadPhotoelectricSignal.bit2 = getBit(word66, 10);
      this.upLoadPhotoelectricSignal.bit3 = getBit(word66, 11);
      this.upLoadPhotoelectricSignal.bit4 = getBit(word66, 12);
      this.upLoadPhotoelectricSignal.bit5 = getBit(word66, 13);
      this.upLoadPhotoelectricSignal.bit6 = getBit(word66, 14);
      this.upLoadPhotoelectricSignal.bit7 = getBit(word66, 15);
      this.upLoadPhotoelectricSignal.bit8 = getBit(word66, 0);
      this.upLoadPhotoelectricSignal.bit9 = getBit(word66, 1);
      this.upLoadPhotoelectricSignal.bit10 = getBit(word66, 2);

      // 扫码枪处光电信号 (DBW84)
      let word84 = this.convertToWord(values.DBW84);
      this.scanPhotoelectricSignal.bit0 = getBit(word84, 8);
      this.scanPhotoelectricSignal.bit1 = getBit(word84, 9);
      this.scanPhotoelectricSignal.bit2 = getBit(word84, 10);
      this.scanPhotoelectricSignal.bit3 = getBit(word84, 11);
      this.scanPhotoelectricSignal.bit4 = getBit(word84, 12);
      this.scanPhotoelectricSignal.bit5 = getBit(word84, 13);
      this.scanPhotoelectricSignal.bit6 = getBit(word84, 14);
      this.scanPhotoelectricSignal.bit7 = getBit(word84, 15);
      this.scanPhotoelectricSignal.bit8 = getBit(word84, 0);

      // 请求上位机下发任务(预热小车前）
      this.requestUploadTaskPreheatingCar = Number(values.DBW86);

      // 提升机一楼接货站台扫码数据（托盘号）
      this.elevatorOneFloorScanCode = values.DBB160 ?? '';

      // 一楼顶升移栽区扫码数据（扫码后判断方向）（托盘号）
      this.oneFloorElevatorScanCode = values.DBB190;

      // 提升机二楼接货站台扫码数据（托盘号）
      this.elevatorTwoFloorScanCode = values.DBB220 ?? '';

      // 提升机三楼接货站台扫码数据（托盘号）
      this.elevatorThreeFloorScanCode = values.DBB250 ?? '';

      // 提升机四楼接货站台扫码数据（托盘号）
      this.elevatorFourFloorScanCode = values.DBB280 ?? '';

      // 一楼D灭菌柜接货站台扫码数据（托盘号）
      this.elevatorDDisinfectionScanCode = values.DBB310 ?? '';

      // 一楼E灭菌柜接货站台扫码数据（托盘号）
      this.elevatorEDisinfectionScanCode = values.DBB340 ?? '';

      // 读取小车位置数值
      this.cartPositionValues.cart1 = Number(values.DBW88 ?? 0);
      this.cartPositionValues.cart2 = Number(values.DBW90 ?? 0);
      this.cartPositionValues.cart3 = Number(values.DBW92 ?? 0);
      this.cartPositionValues.cart4 = Number(values.DBW94 ?? 0);

      this.upLoad1Quantity = Number(values.DBW424);
      this.upLoad2Quantity = Number(values.DBW426);
      this.buffer1Quantity = Number(values.DBW428);
      this.buffer2Quantity = Number(values.DBW430);

      // 预热、灭菌、解析柜状态-读取PLC
      let word432 = this.convertToWord(values.DBW432);
      this.preheatingDisinfectionAnalysisState.bit0 = getBit(word432, 8);
      this.preheatingDisinfectionAnalysisState.bit1 = getBit(word432, 9);
      this.preheatingDisinfectionAnalysisState.bit2 = getBit(word432, 10);
      this.preheatingDisinfectionAnalysisState.bit3 = getBit(word432, 11);
      this.preheatingDisinfectionAnalysisState.bit4 = getBit(word432, 12);
      this.preheatingDisinfectionAnalysisState.bit5 = getBit(word432, 13);
      this.preheatingDisinfectionAnalysisState.bit6 = getBit(word432, 14);
      this.preheatingDisinfectionAnalysisState.bit7 = getBit(word432, 15);
      this.preheatingDisinfectionAnalysisState.bit8 = getBit(word432, 0);

      // 更新报警点位数据 - 统一使用convertToWord处理word数据
      // 先保存旧值用于报警检查
      const oldAlarmPoints = { ...this.alarmPoints };

      this.alarmPoints.DBW370 = this.convertToWord(values.DBW370 ?? 0);
      this.alarmPoints.DBW372 = this.convertToWord(values.DBW372 ?? 0);
      this.alarmPoints.DBW374 = this.convertToWord(values.DBW374 ?? 0);
      this.alarmPoints.DBW376 = this.convertToWord(values.DBW376 ?? 0);
      this.alarmPoints.DBW378 = this.convertToWord(values.DBW378 ?? 0);
      this.alarmPoints.DBW380 = this.convertToWord(values.DBW380 ?? 0);
      this.alarmPoints.DBW382 = this.convertToWord(values.DBW382 ?? 0);
      this.alarmPoints.DBW384 = this.convertToWord(values.DBW384 ?? 0);
      this.alarmPoints.DBW386 = this.convertToWord(values.DBW386 ?? 0);
      this.alarmPoints.DBW388 = this.convertToWord(values.DBW388 ?? 0);
      this.alarmPoints.DBW390 = this.convertToWord(values.DBW390 ?? 0);
      this.alarmPoints.DBW392 = this.convertToWord(values.DBW392 ?? 0);
      this.alarmPoints.DBW394 = this.convertToWord(values.DBW394 ?? 0);
      this.alarmPoints.DBW396 = this.convertToWord(values.DBW396 ?? 0);
      this.alarmPoints.DBW398 = this.convertToWord(values.DBW398 ?? 0);
      this.alarmPoints.DBW400 = this.convertToWord(values.DBW400 ?? 0);
      this.alarmPoints.DBW402 = this.convertToWord(values.DBW402 ?? 0);
      this.alarmPoints.DBW404 = this.convertToWord(values.DBW404 ?? 0);
      this.alarmPoints.DBW406 = this.convertToWord(values.DBW406 ?? 0);
      this.alarmPoints.DBW408 = this.convertToWord(values.DBW408 ?? 0);
      this.alarmPoints.DBW410 = this.convertToWord(values.DBW410 ?? 0);
      this.alarmPoints.DBW412 = this.convertToWord(values.DBW412 ?? 0);
      this.alarmPoints.DBW414 = this.convertToWord(values.DBW414 ?? 0);
      this.alarmPoints.DBW416 = this.convertToWord(values.DBW416 ?? 0);
      this.alarmPoints.DBW418 = this.convertToWord(values.DBW418 ?? 0);
      this.alarmPoints.DBW420 = this.convertToWord(values.DBW420 ?? 0);
      this.alarmPoints.DBW422 = this.convertToWord(values.DBW422 ?? 0);

      // 手动检查报警点位变化并触发报警
      this.checkAlarmPoints(oldAlarmPoints);

      // 只在第一次接收到数据时设置标志位为 true
      if (!this.isDataReady) {
        this.isDataReady = true;
      }
    });
    // 测试模式下，把上边注释，下面打开
    // if (!this.isDataReady) {
    //   this.isDataReady = true;
    // }
  },
  watch: {
    // 切换预热房选择，更新DBW546
    preheatingRoomSelected(newVal) {
      if (!this.isDataReady) return;
      if (!newVal) {
        this.cancelPreheatingRoom();
      } else {
        this.updatePreheatNeedAndWrite();
      }

      // 检查预热房选择冲突：预热选择A，预热到灭菌的预热就不能选择A
      if (newVal && this.disinfectionRoomSelectedFrom === newVal) {
        this.preheatingRoomSelected = null;
        this.addLog(
          `预热房${newVal}已被选择为预热到灭菌的来源，不能同时设置为预热房进货，已自动取消预热房进货设置`
        );
        this.$message({
          message: `⚠️ 预热房${newVal}已被选择为预热到灭菌的来源，不能同时设置为预热房进货，已自动取消预热房进货设置`,
          type: 'warning',
          duration: 5000,
          showClose: true
        });
      }
    },
    // 切换预热->灭菌来源预热房，更新DBW548
    disinfectionRoomSelectedFrom(newVal) {
      if (!this.isDataReady) return;
      if (!newVal) {
        this.cancelDisinfectionRoom();
      } else {
        this.updateDisinfectionNeedAndWrite();
      }

      // 检查预热到灭菌来源冲突：预热到灭菌的预热选择A，预热就不能选择A
      if (newVal && this.preheatingRoomSelected === newVal) {
        this.disinfectionRoomSelectedFrom = null;
        this.addLog(
          `预热房${newVal}已被选择为预热房进货，不能同时设置为预热到灭菌的来源，已自动取消预热到灭菌来源设置`
        );
        this.$message({
          message: `⚠️ 预热房${newVal}已被选择为预热房进货，不能同时设置为预热到灭菌的来源，已自动取消预热到灭菌来源设置`,
          type: 'warning',
          duration: 5000,
          showClose: true
        });
      }
    },
    // 切换灭菌->解析来源灭菌柜，更新DBW550
    warehouseSelectedFrom(newVal) {
      if (!this.isDataReady) return;
      if (!newVal) {
        this.cancelAnalysisRoom();
      } else {
        this.updateAnalysisNeedAndWrite();
      }

      // 检查灭菌到解析来源冲突：灭菌到解析的灭菌选择A，预热到灭菌的灭菌就不能选择A
      if (newVal && this.disinfectionRoomSelectedTo === newVal) {
        this.warehouseSelectedFrom = null;
        this.addLog(
          `灭菌房${newVal}已被选择为预热到灭菌的目的地，不能同时设置为灭菌到解析的来源，已自动取消灭菌到解析来源设置`
        );
        this.$message({
          message: `⚠️ 灭菌房${newVal}已被选择为预热到灭菌的目的地，不能同时设置为灭菌到解析的来源，已自动取消灭菌到解析来源设置`,
          type: 'warning',
          duration: 5000,
          showClose: true
        });
      }
    },
    // 切换出库选择，更新DBW560
    outWarehouseSelected(newVal) {
      if (!this.isDataReady) return;
      if (!newVal) {
        this.cancelOutWarehouse();
      } else {
        this.updateOutNeedAndWrite();
      }

      // 检查出库选择冲突：出库选择A，灭菌到解析的解析就不能选择A
      if (newVal && this.warehouseSelectedTo === newVal) {
        this.outWarehouseSelected = null;
        this.addLog(
          `解析库${newVal}已被选择为灭菌到解析的目的地，不能同时设置为出库来源，已自动取消出库设置`
        );
        this.$message({
          message: `⚠️ 解析库${newVal}已被选择为灭菌到解析的目的地，不能同时设置为出库来源，已自动取消出库设置`,
          type: 'warning',
          duration: 5000,
          showClose: true
        });
      }
    },
    // 切换灭菌房目的地选择
    disinfectionRoomSelectedTo(newVal) {
      if (!this.isDataReady) return;

      // 检查预热到灭菌目的地冲突：预热到灭菌的灭菌选择A，灭菌到解析的灭菌就不能选择A
      if (newVal && this.warehouseSelectedFrom === newVal) {
        this.disinfectionRoomSelectedTo = null;
        this.addLog(
          `灭菌房${newVal}已被选择为灭菌到解析的来源，不能同时设置为预热到灭菌的目的地，已自动取消预热到灭菌目的地设置`
        );
        this.$message({
          message: `⚠️ 灭菌房${newVal}已被选择为灭菌到解析的来源，不能同时设置为预热到灭菌的目的地，已自动取消预热到灭菌目的地设置`,
          type: 'warning',
          duration: 5000,
          showClose: true
        });
      }
    },
    // 切换解析库目的地选择
    warehouseSelectedTo(newVal) {
      if (!this.isDataReady) return;

      // 检查灭菌到解析目的地冲突：灭菌到解析的解析选择A，出库就不能选择A
      if (newVal && this.outWarehouseSelected === newVal) {
        this.warehouseSelectedTo = null;
        this.addLog(
          `解析库${newVal}已被选择为出库来源，不能同时设置为灭菌到解析的目的地，已自动取消灭菌到解析目的地设置`
        );
        this.$message({
          message: `⚠️ 解析库${newVal}已被选择为出库来源，不能同时设置为灭菌到解析的目的地，已自动取消灭菌到解析目的地设置`,
          type: 'warning',
          duration: 5000,
          showClose: true
        });
      }
    },
    // 一楼接货站台光电信号
    'scanPhotoelectricSignal.bit0'(newVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;

      if (newVal === '0') {
        this.elevatorOneFloorScanCode = '';
        this.addLog('一楼接货站台光电信号无货，已清空一楼接货站台扫码数据');
        // 光电复0，停止允许通行
        this.stopAllowForPort('1');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('一楼接货站台触发光电信号，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueue('一楼接货站台', this.nonSterileOne);
          this.sendAllowForPort('1');
        } else {
          this.addLog(`一楼接货站台扫码数据：${this.elevatorOneFloorScanCode}`);
          this.addToUpLoadQueue(
            this.elevatorOneFloorScanCode,
            '一楼接货站台',
            this.nonSterileOne
          );
        }
      }
    },
    // 二楼接货站台光电信号
    'scanPhotoelectricSignal.bit2'(newVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;

      if (newVal === '0') {
        this.elevatorTwoFloorScanCode = '';
        this.addLog('二楼接货站台光电信号无货，已清空二楼接货站台扫码数据');
        // 光电复0，停止允许通行
        this.stopAllowForPort('2');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('二楼接货站台触发光电信号，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueue('二楼接货站台', this.nonSterileTwo);
          this.sendAllowForPort('2');
        } else {
          this.addLog(`二楼接货站台扫码数据：${this.elevatorTwoFloorScanCode}`);
          this.addToUpLoadQueue(
            this.elevatorTwoFloorScanCode,
            '二楼接货站台',
            this.nonSterileTwo
          );
        }
      }
    },
    // 三楼接货站台光电信号
    'scanPhotoelectricSignal.bit4'(newVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;

      if (newVal === '0') {
        this.elevatorThreeFloorScanCode = '';
        this.addLog('三楼接货站台光电信号无货，已清空三楼接货站台扫码数据');
        // 光电复0，停止允许通行
        this.stopAllowForPort('3');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('三楼接货站台触发光电信号，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueue('三楼接货站台', this.nonSterileThree);
          this.sendAllowForPort('3');
        } else {
          this.addLog(
            `三楼接货站台扫码数据：${this.elevatorThreeFloorScanCode}`
          );
          this.addToUpLoadQueue(
            this.elevatorThreeFloorScanCode,
            '三楼接货站台',
            this.nonSterileThree
          );
        }
      }
    },
    // 四楼接货站台光电信号
    'scanPhotoelectricSignal.bit5'(newVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;

      if (newVal === '0') {
        this.elevatorFourFloorScanCode = '';
        this.addLog('四楼接货站台光电信号无货，已清空四楼接货站台扫码数据');
        // 光电复0，停止允许通行
        this.stopAllowForPort('4');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('四楼接货站台触发光电信号，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueue('四楼接货站台', this.nonSterileFour);
          this.sendAllowForPort('4');
        } else {
          this.addLog(
            `四楼接货站台扫码数据：${this.elevatorFourFloorScanCode}`
          );
          this.addToUpLoadQueue(
            this.elevatorFourFloorScanCode,
            '四楼接货站台',
            this.nonSterileFour
          );
        }
      }
    },
    // 一楼D灭菌"有载信号"/光电占位,
    'scanPhotoelectricSignal.bit7'(newVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;

      if (newVal === '0') {
        this.elevatorDDisinfectionScanCode = '';
        this.addLog('D扫码数据清空');
        // 光电复0，停止允许通行
        this.stopAllowForPort('D');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('D口光电触发，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueueDE('D', this.nonSterileD);
          this.sendAllowForPort('D');
          // 扫码放行时，若未执行或选择了D，则发送D出货命令
          if (!this.outWarehouseSelected || this.outWarehouseSelected === 'D') {
            ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 1);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW536');
            }, 2000);
            this.addLog('D扫码放行，满足条件，发送D出货命令');
          }
        } else {
          this.addLog(`D扫码数据：${this.elevatorDDisinfectionScanCode}`);
          this.addToUpLoadQueueDE(
            this.elevatorDDisinfectionScanCode,
            'D',
            this.nonSterileD
          );
          // 扫码放行时，若未执行或选择了D，则发送D出货命令
          if (!this.outWarehouseSelected || this.outWarehouseSelected === 'D') {
            ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 1);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW536');
            }, 2000);
            this.addLog('D扫码放行，满足条件，发送D出货命令');
          }
        }
      }
    },
    // 一楼E灭菌"有载信号"/光电占位,
    'scanPhotoelectricSignal.bit8'(newVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;

      if (newVal === '0') {
        this.elevatorEDisinfectionScanCode = '';
        this.addLog('E扫码数据清空');
        // 光电复0，停止允许通行
        this.stopAllowForPort('E');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('E口光电触发，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueueDE('E', this.nonSterileE);
          this.sendAllowForPort('E');
          // 扫码放行时，若未执行或选择了E，则发送E出货命令
          if (!this.outWarehouseSelected || this.outWarehouseSelected === 'E') {
            ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 2);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW536');
            }, 2000);
            this.addLog('E扫码放行，满足条件，发送E出货命令');
          }
        } else {
          this.addLog(`E扫码数据：${this.elevatorEDisinfectionScanCode}`);
          this.addToUpLoadQueueDE(
            this.elevatorEDisinfectionScanCode,
            'E',
            this.nonSterileE
          );
          // 扫码放行时，若未执行或选择了E，则发送E出货命令
          if (!this.outWarehouseSelected || this.outWarehouseSelected === 'E') {
            ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 2);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW536');
            }, 2000);
            this.addLog('E扫码放行，满足条件，发送E出货命令');
          }
        }
      }
    },
    // 一楼缓存区光电信号
    'scanPhotoelectricSignal.bit1'(newVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;

      if (newVal === '0') {
        this.oneFloorElevatorScanCode = '';
        this.addLog('一楼缓存区光电信号无货，已清空一楼缓存区扫码数据');
      }
      if (newVal === '1') {
        this.addLog(`一楼缓存区扫码数据：${this.oneFloorElevatorScanCode}`);
        // 判断是否消毒，如果消毒则此托盘进入下一队列，如果不消毒直接发走
        this.addToCartLoadQueue(this.oneFloorElevatorScanCode);
      }
    },
    // 请求上位机下发任务(判断去灭菌还是非灭菌）
    requestUploadTask: {
      async handler(newVal, oldVal) {
        // 只有在数据准备就绪后才执行监听逻辑
        if (!this.isDataReady) return;

        // 当信号从1变为0时，执行队列移动逻辑
        if (oldVal === 1 && newVal === 0) {
          this.addLog('请求上位机下发任务信号由1变0，开始执行队列移动');
          // 执行缓冲区队列移动逻辑：把分发区的符合条件的托盘移动到缓冲区
          if (this.queues[1]?.trayInfo && this.queues[1].trayInfo.length > 0) {
            // 查找state为1，并且isTerile为1的第一个托盘，加入到缓冲区队列
            const targetTrayIndex = this.queues[1].trayInfo.findIndex(
              (tray) => tray.state === '1' && tray.isTerile === 1
            );
            if (targetTrayIndex !== -1) {
              // 找到符合条件的托盘
              const targetTray = this.queues[1].trayInfo[targetTrayIndex];
              this.addLog(`${targetTray.trayCode} 由分发区进入缓冲区`);
              // 把符合条件的托盘信息加入到缓冲区
              this.queues[2].trayInfo.push(targetTray);
              // 从分发区删除该托盘信息
              this.queues[1].trayInfo.splice(targetTrayIndex, 1);
              // 如果缓冲区达到16个，则显示小车1设置去哪个预热房的按钮
              if (this.queues[2].trayInfo.length === 16) {
                this.showCar1SetPreheatingRoom = true;
              }
            } else {
              this.addLog('分发区没有找到符合条件的托盘(已执行且灭菌的托盘)');
            }
          } else {
            this.addLog('分发区没有托盘信息，无法执行队列移动');
          }
        }

        // 当信号从0变为1时，执行原有的灭菌/非灭菌判断逻辑
        if (newVal === 1) {
          this.addLog('请求上位机下发任务(判断去灭菌还是非灭菌）');
          // 先筛选出分发区中未处理过的第一个托盘数据，属性state等于'1'代表已经处理过。'0'代表没有处理过
          if (this.queues[1]?.trayInfo) {
            const targetIndex = this.queues[1].trayInfo.findIndex(
              (tray) => tray.state === '0'
            );

            if (targetIndex !== -1) {
              const targetTray = this.queues[1].trayInfo[targetIndex];
              if (targetTray.isTerile === 0) {
                // 给PLC发送去立库的命令
                this.addLog(
                  `判断到非灭菌托盘：${targetTray.trayCode}，发送去立库命令`
                );
                ipcRenderer.send('writeSingleValueToPLC', 'DBW542', 1);
                setTimeout(() => {
                  ipcRenderer.send('cancelWriteToPLC', 'DBW542');
                }, 2000);
              } else {
                this.addLog(
                  `判断到灭菌托盘：${targetTray.trayCode}，发送去预热房命令`
                );
                // 给PLC发送去预热房的命令
                ipcRenderer.send('writeSingleValueToPLC', 'DBW542', 2);
                setTimeout(() => {
                  ipcRenderer.send('cancelWriteToPLC', 'DBW542');
                }, 2000);
              }
              this.$set(this.queues[1].trayInfo, targetIndex, {
                ...targetTray,
                state: '1'
              });
            } else {
              if (this.noCodeUpload) {
                // 无码模式：自动添加无码托盘并发送去预热房命令
                const trayInfo = {
                  trayCode: 'no-tray-code',
                  trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                  orderId: 'NO-ORDER',
                  productCode: 'NO-PRODUCT',
                  productName: '无码产品',
                  isTerile: 1, // 灭菌托盘
                  state: '1', // 已处理
                  sendTo: '',
                  // 预热间信息
                  preheatingRoom: '',
                  inPreheatingRoomTime: null,
                  outPreheatingRoomTime: null,
                  // 灭菌间信息
                  sterilizationRoom: '',
                  inSterilizationRoomTime: null,
                  outSterilizationRoomTime: null,
                  // 解析间信息
                  analysisRoom: '',
                  inAnalysisRoomTime: null,
                  outAnalysisRoomTime: null
                };
                this.queues[1].trayInfo.push(trayInfo);
                this.addLog('无码模式：分发区自动补托盘并发送去预热房命令');

                // 给PLC发送去预热房的命令
                ipcRenderer.send('writeSingleValueToPLC', 'DBW542', 2);
                setTimeout(() => {
                  ipcRenderer.send('cancelWriteToPLC', 'DBW542');
                }, 2000);
              } else {
                // 报错
                this.addLog('错误：分发区中未处理过的第一个托盘数据不存在');
              }
            }
          }
        }
      }
    },
    requestUploadTaskPreheatingCar: {
      async handler(newVal) {
        // 只有在数据准备就绪后才执行监听逻辑
        if (!this.isDataReady) return;

        // 请求上位机下发任务(预热小车前）
        if (newVal === 1) {
          this.addLog('收到-请求上位机下发任务(预热小车前)');
          // 判断当前有没有执行中的预热房
          if (!this.preheatExecuting) {
            this.addLog('当前没有执行中的预热房，无法执行预热小车前信号请求');
            return;
          }
          this.sendToPreheatingRoom();
        }
      }
    },
    // 监听缓冲区数量变化
    bufferQuantity: {
      async handler(newVal, oldVal) {
        // 只有在数据准备就绪后才执行监听逻辑
        if (!this.isDataReady) return;

        // 当数量增加时，检查是否达到16个来显示入库按钮
        if (newVal > oldVal) {
          // 如果bufferQuantity达到16个，则显示小车1设置去哪个预热房的按钮
          if (newVal === 16) {
            this.showCar1SetPreheatingRoom = true;
          }
        } else if (newVal < oldVal) {
          // 减少到0说明不再执行了。
          if (newVal === 0) {
            this.preWarmTrayCode = '';
          }
        }
      }
    },
    // 监听非灭菌缓存区数量变化,
    nonSterileunload: {
      async handler(newVal, oldVal) {
        // 只有在数据准备就绪后才执行监听逻辑
        if (!this.isDataReady) return;

        if (newVal > oldVal) {
          if (this.queues[1].trayInfo.length > 0) {
            // 查找state为1，并且isTerile为1的第一个托盘，加入到缓冲区队列
            const targetTrayIndex = this.queues[1].trayInfo.findIndex(
              (tray) => tray.state === '1' && tray.isTerile === 0
            );
            if (targetTrayIndex !== -1) {
              // 找到符合条件的托盘
              this.addLog(
                this.queues[1].trayInfo[targetTrayIndex].trayCode +
                  '进入非灭菌缓存区。'
              );
              // 把符合条件的托盘信息加入到缓冲区
              this.queues[14].trayInfo.push(
                this.queues[1].trayInfo[targetTrayIndex]
              );
              // 从分发区删除该托盘信息
              this.queues[1].trayInfo.splice(targetTrayIndex, 1);
            } else {
              this.addLog('分发区没有找到符合条件的托盘(已执行且不灭菌的托盘)');
            }
            // 如果bufferQuantity达到16个，则显示小车1设置去哪个预热房的按钮
            if (newVal === 16) {
              this.showCar1SetPreheatingRoom = true;
            }
          }
        } else {
          // 说明是减少了,说明是出库了
          if (newVal < oldVal) {
            if (this.queues[14].trayInfo.length > 0) {
              // 把非灭菌缓存区的第一个元素数据展示到下货
              const tray = this.queues[14].trayInfo[0];
              this.addLog(`托盘信息：${tray.trayCode} 出库`);
              this.currentOutTrayInfo = tray;
              console.log(this.currentOutTrayInfo);

              // 调用WMS出货接口（非灭菌出货，state: 0）
              this.callWmsUnloadGoods(tray.trayCode, 0);

              // 删除非灭菌缓存区的第一个元素
              this.queues[14].trayInfo.shift();

              // 更新订单状态为已完成
              this.updateOrderStatus(tray);
            }
          }
        }
      }
    },
    // 监听A1数量变化
    'aLineQuantity.a1'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        // 先判断当前选择执行的预热房是否是A1
        if (this.preheatingRoomSelected !== 'A') {
          this.addLog(
            `A1队列数量增加${
              newVal - oldVal
            }，但当前选择执行的预热房不是A1，跳过托盘移动`
          );
          return;
        }

        const increaseCount = newVal - oldVal;
        let movedCount = 0;

        // 移动指定数量的A1托盘
        for (let i = 0; i < increaseCount; i++) {
          // 找到第一个sendTo为A1-1或A1-2的托盘
          const trayIndex = this.queues[2].trayInfo.findIndex(
            (tray) => tray.sendTo === 'A1-1' || tray.sendTo === 'A1-2'
          );

          if (trayIndex !== -1) {
            const tray = this.queues[2].trayInfo[trayIndex];
            // 设置托盘顺序编号
            this.setTraySequenceNumber(tray, 3);
            const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            this.$set(tray, 'preheatingRoom', 'A1');
            this.$set(tray, 'inPreheatingRoomTime', currentTime);
            this.addLog(
              `托盘 ${tray.trayCode} 进入预热间 A1，时间：${currentTime}，顺序编号：${tray.sequenceNumber}，目标位置：${tray.sendTo}`
            );
            // 更新到后台
            this.updateTrayInfo(tray, {
              preheatingRoom: 'A1',
              inPreheatingRoomTime: currentTime
            });
            // 把缓冲区的托盘信息加入到A1队列
            this.queues[3].trayInfo.push(tray);
            this.queues[2].trayInfo.splice(trayIndex, 1);
            movedCount++;
          } else {
            // 没有更多匹配的托盘，跳出循环
            break;
          }
        }

        // 记录移动结果
        if (movedCount < increaseCount) {
          this.addLog(
            `A1队列数量增加${increaseCount}，但缓冲区中sendTo为A1的托盘不足，仅移动${movedCount}个托盘`
          );
        }

        // 如果缓冲区队列数量变为0，则重新隐藏小车1设置去哪个预热房的按钮
        if (this.queues[2].trayInfo.length === 0) {
          this.showCar1SetPreheatingRoom = false;
        }
      }
      // 动态更新与写入：预热/灭菌需求
      if (this.preheatExecuting && this.preheatingRoomSelected === 'A') {
        this.updatePreheatNeedAndWrite();
      }
      if (this.disinfectionRoomSelectedFrom === 'A') {
        this.updateDisinfectionNeedAndWrite();
      }
      // 检查目的地限制 - 只有当当前选择的预热房是A时才检查
      if (this.preheatingRoomSelected === 'A') {
        this.checkDestinationLimit();
      }
    },
    // 监听B1数量变化
    'bLineQuantity.b1'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        // 先判断当前选择执行的预热房是否是B1
        if (this.preheatingRoomSelected !== 'B') {
          this.addLog(
            `B1队列数量增加${
              newVal - oldVal
            }，但当前选择执行的预热房不是B1，跳过托盘移动`
          );
          return;
        }

        const increaseCount = newVal - oldVal;
        let movedCount = 0;

        // 移动指定数量的B1托盘
        for (let i = 0; i < increaseCount; i++) {
          // 找到第一个sendTo为B1-1或B1-2的托盘
          const trayIndex = this.queues[2].trayInfo.findIndex(
            (tray) => tray.sendTo === 'B1-1' || tray.sendTo === 'B1-2'
          );

          if (trayIndex !== -1) {
            const tray = this.queues[2].trayInfo[trayIndex];
            // 设置托盘顺序编号
            this.setTraySequenceNumber(tray, 4);
            const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            this.$set(tray, 'preheatingRoom', 'B1');
            this.$set(tray, 'inPreheatingRoomTime', currentTime);
            this.addLog(
              `托盘 ${tray.trayCode} 进入预热间 B1，时间：${currentTime}，顺序编号：${tray.sequenceNumber}，目标位置：${tray.sendTo}`
            );
            // 更新到后台
            this.updateTrayInfo(tray, {
              preheatingRoom: 'B1',
              inPreheatingRoomTime: currentTime
            });
            // 把缓冲区的托盘信息加入到B1队列
            this.queues[4].trayInfo.push(tray);
            this.queues[2].trayInfo.splice(trayIndex, 1);
            movedCount++;
          } else {
            // 没有更多匹配的托盘，跳出循环
            break;
          }
        }

        // 记录移动结果
        if (movedCount < increaseCount) {
          this.addLog(
            `B1队列数量增加${increaseCount}，但缓冲区中sendTo为B1的托盘不足，仅移动${movedCount}个托盘`
          );
        }

        // 如果缓冲区队列数量变为0，则重新隐藏小车1设置去哪个预热房的按钮
        if (this.queues[2].trayInfo.length === 0) {
          this.showCar1SetPreheatingRoom = false;
        }
      }
      // 动态更新与写入：预热/灭菌需求
      if (this.preheatExecuting && this.preheatingRoomSelected === 'B') {
        this.updatePreheatNeedAndWrite();
      }
      if (this.disinfectionRoomSelectedFrom === 'B') {
        this.updateDisinfectionNeedAndWrite();
      }
      // 检查目的地限制 - 只有当当前选择的预热房是B时才检查
      if (this.preheatingRoomSelected === 'B') {
        this.checkDestinationLimit();
      }
    },
    // 监听C1数量变化
    'cLineQuantity.c1'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        // 先判断当前选择执行的预热房是否是C1
        if (this.preheatingRoomSelected !== 'C') {
          this.addLog(
            `C1队列数量增加${
              newVal - oldVal
            }，但当前选择执行的预热房不是C1，跳过托盘移动`
          );
          return;
        }

        const increaseCount = newVal - oldVal;
        let movedCount = 0;

        // 移动指定数量的C1托盘
        for (let i = 0; i < increaseCount; i++) {
          // 找到第一个sendTo为C1-1或C1-2的托盘
          const trayIndex = this.queues[2].trayInfo.findIndex(
            (tray) => tray.sendTo === 'C1-1' || tray.sendTo === 'C1-2'
          );

          if (trayIndex !== -1) {
            const tray = this.queues[2].trayInfo[trayIndex];
            // 设置托盘顺序编号
            this.setTraySequenceNumber(tray, 5);
            const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
            this.$set(tray, 'preheatingRoom', 'C1');
            this.$set(tray, 'inPreheatingRoomTime', currentTime);
            this.addLog(
              `托盘 ${tray.trayCode} 进入预热间 C1，时间：${currentTime}，顺序编号：${tray.sequenceNumber}，目标位置：${tray.sendTo}`
            );
            // 更新到后台
            this.updateTrayInfo(tray, {
              preheatingRoom: 'C1',
              inPreheatingRoomTime: currentTime
            });
            // 把缓冲区的托盘信息加入到C1队列
            this.queues[5].trayInfo.push(tray);
            this.queues[2].trayInfo.splice(trayIndex, 1);
            movedCount++;
          } else {
            // 没有更多匹配的托盘，跳出循环
            break;
          }
        }

        // 记录移动结果
        if (movedCount < increaseCount) {
          this.addLog(
            `C1队列数量增加${increaseCount}，但缓冲区中sendTo为C1的托盘不足，仅移动${movedCount}个托盘`
          );
        }

        // 如果缓冲区队列数量变为0，则重新隐藏小车1设置去哪个预热房的按钮
        if (this.queues[2].trayInfo.length === 0) {
          this.showCar1SetPreheatingRoom = false;
        }
      }
      // 动态更新与写入：预热/灭菌需求
      if (this.preheatExecuting && this.preheatingRoomSelected === 'C') {
        this.updatePreheatNeedAndWrite();
      }
      if (this.disinfectionRoomSelectedFrom === 'C') {
        this.updateDisinfectionNeedAndWrite();
      }
      // 检查目的地限制 - 只有当当前选择的预热房是C时才检查
      if (this.preheatingRoomSelected === 'C') {
        this.checkDestinationLimit();
      }
    },
    // 监听A2数量变化
    'aLineQuantity.a2'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        const increaseCount = newVal - oldVal;
        // 先判断当前选择发送的是A2么
        if (this.disinfectionRoomSelectedTo === 'A') {
          let sourceQueueIndex;
          let sourceName;
          // 看看A2是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.disinfectionRoomSelectedFrom === 'A') {
            sourceQueueIndex = 3; // A1队列
            sourceName = 'A1';
          } else if (this.disinfectionRoomSelectedFrom === 'B') {
            sourceQueueIndex = 4; // B1队列
            sourceName = 'B1';
          } else if (this.disinfectionRoomSelectedFrom === 'C') {
            sourceQueueIndex = 5; // C1队列
            sourceName = 'C1';
          }

          if (sourceQueueIndex !== undefined) {
            const sourceQueue = this.queues[sourceQueueIndex];
            const availableTrays = sourceQueue.trayInfo || [];

            if (availableTrays.length >= increaseCount) {
              // 批量移动托盘
              for (let i = 0; i < increaseCount; i++) {
                if (sourceQueue.trayInfo.length > 0) {
                  const tray = sourceQueue.trayInfo[0];
                  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                  this.$set(tray, 'outPreheatingRoomTime', currentTime);
                  this.$set(tray, 'sterilizationRoom', 'A2');
                  this.$set(tray, 'inSterilizationRoomTime', currentTime);

                  // 计算灭菌柜的sendTo编号：A1-1→A2-1, A1-2→A2-2
                  if (tray.sendTo) {
                    const originalSendTo = tray.sendTo;
                    if (originalSendTo.startsWith('A1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `A2-${suffix}`;
                    } else if (originalSendTo.startsWith('B1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `A2-${suffix}`; // 进入A灭菌柜
                    } else if (originalSendTo.startsWith('C1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `A2-${suffix}`; // 进入A灭菌柜
                    }
                  }

                  this.addLog(
                    `托盘 ${tray.trayCode} 离开预热间 ${tray.preheatingRoom}，进入灭菌间 A2，时间：${currentTime}，目标位置：${tray.sendTo}`
                  );
                  // 更新到后台
                  this.updateTrayInfo(tray, {
                    outPreheatingRoomTime: currentTime,
                    sterilizationRoom: 'A2',
                    inSterilizationRoomTime: currentTime
                  });
                  this.queues[6].trayInfo.push(tray);
                  sourceQueue.trayInfo.shift();
                }
              }
              this.addLog(
                `从${sourceName}队列移动${increaseCount}个托盘到A2队列`
              );
            } else {
              this.addLog(
                `A2队列数量增加${increaseCount}，但${sourceName}队列托盘不足，仅移动${availableTrays.length}个托盘`
              );
              // 移动所有可用的托盘
              while (sourceQueue.trayInfo.length > 0) {
                const tray = sourceQueue.trayInfo[0];
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                this.$set(tray, 'outPreheatingRoomTime', currentTime);
                this.$set(tray, 'sterilizationRoom', 'A2');
                this.$set(tray, 'inSterilizationRoomTime', currentTime);

                // 计算灭菌柜的sendTo编号：A1-1→A2-1, A1-2→A2-2
                if (tray.sendTo) {
                  const originalSendTo = tray.sendTo;
                  if (originalSendTo.startsWith('A1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `A2-${suffix}`;
                  } else if (originalSendTo.startsWith('B1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `A2-${suffix}`; // 进入A灭菌柜
                  } else if (originalSendTo.startsWith('C1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `A2-${suffix}`; // 进入A灭菌柜
                  }
                }

                this.addLog(
                  `托盘 ${tray.trayCode} 离开预热间 ${tray.preheatingRoom}，进入灭菌间 A2，时间：${currentTime}，目标位置：${tray.sendTo}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outPreheatingRoomTime: currentTime,
                  sterilizationRoom: 'A2',
                  inSterilizationRoomTime: currentTime
                });
                this.queues[6].trayInfo.push(tray);
                sourceQueue.trayInfo.shift();
              }
            }
          }
        } else {
          // 不是设置发往A2的，但是A2却增加了，说明有问题，直接报警
          this.addLog('未设置发送到A2，程序错误！报警！');
        }
      }
      // 动态更新与写入：解析需求
      if (this.warehouseSelectedFrom === 'A') {
        this.updateAnalysisNeedAndWrite();
      }
      // 检查是否需要停止执行：如果目的地队列数量等于目标总数量
      if (
        this.disinfectionRoomSelectedTo === 'A' &&
        this.disinfectionExecuting
      ) {
        if (newVal === this.disinfectionTargetTotal) {
          this.cancelDisinfectionRoom();
          this.addLog(
            `预热房到灭菌柜执行完成，目的地A2队列数量达到目标总数量${this.disinfectionTargetTotal}，已自动停止执行`
          );
        }
      }
      // 检查目的地限制 - 只有当当前选择的灭菌房目的地是A时才检查
      if (this.disinfectionRoomSelectedTo === 'A') {
        this.checkDestinationLimit();
      }
    },
    // 监视B2数量变化
    'bLineQuantity.b2'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        const increaseCount = newVal - oldVal;
        // 先判断当前选择发送的是B2么
        if (this.disinfectionRoomSelectedTo === 'B') {
          let sourceQueueIndex;
          let sourceName;
          // 看看B2是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.disinfectionRoomSelectedFrom === 'A') {
            sourceQueueIndex = 3; // A1队列
            sourceName = 'A1';
          } else if (this.disinfectionRoomSelectedFrom === 'B') {
            sourceQueueIndex = 4; // B1队列
            sourceName = 'B1';
          } else if (this.disinfectionRoomSelectedFrom === 'C') {
            sourceQueueIndex = 5; // C1队列
            sourceName = 'C1';
          }

          if (sourceQueueIndex !== undefined) {
            const sourceQueue = this.queues[sourceQueueIndex];
            const availableTrays = sourceQueue.trayInfo || [];

            if (availableTrays.length >= increaseCount) {
              // 批量移动托盘
              for (let i = 0; i < increaseCount; i++) {
                if (sourceQueue.trayInfo.length > 0) {
                  const tray = sourceQueue.trayInfo[0];
                  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                  this.$set(tray, 'outPreheatingRoomTime', currentTime);
                  this.$set(tray, 'sterilizationRoom', 'B2');
                  this.$set(tray, 'inSterilizationRoomTime', currentTime);

                  // 计算灭菌柜的sendTo编号：A1-1→B2-1, A1-2→B2-2
                  if (tray.sendTo) {
                    const originalSendTo = tray.sendTo;
                    if (originalSendTo.startsWith('A1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `B2-${suffix}`; // 进入B灭菌柜
                    } else if (originalSendTo.startsWith('B1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `B2-${suffix}`;
                    } else if (originalSendTo.startsWith('C1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `B2-${suffix}`; // 进入B灭菌柜
                    }
                  }

                  this.addLog(
                    `托盘 ${tray.trayCode} 离开预热间 ${tray.preheatingRoom}，进入灭菌间 B2，时间：${currentTime}，目标位置：${tray.sendTo}`
                  );
                  // 更新到后台
                  this.updateTrayInfo(tray, {
                    outPreheatingRoomTime: currentTime,
                    sterilizationRoom: 'B2',
                    inSterilizationRoomTime: currentTime
                  });
                  this.queues[7].trayInfo.push(tray);
                  sourceQueue.trayInfo.shift();
                }
              }
              this.addLog(
                `从${sourceName}队列移动${increaseCount}个托盘到B2队列`
              );
            } else {
              this.addLog(
                `B2队列数量增加${increaseCount}，但${sourceName}队列托盘不足，仅移动${availableTrays.length}个托盘`
              );
              // 移动所有可用的托盘
              while (sourceQueue.trayInfo.length > 0) {
                const tray = sourceQueue.trayInfo[0];
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                this.$set(tray, 'outPreheatingRoomTime', currentTime);
                this.$set(tray, 'sterilizationRoom', 'B2');
                this.$set(tray, 'inSterilizationRoomTime', currentTime);

                // 计算灭菌柜的sendTo编号：A1-1→B2-1, A1-2→B2-2
                if (tray.sendTo) {
                  const originalSendTo = tray.sendTo;
                  if (originalSendTo.startsWith('A1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `B2-${suffix}`; // 进入B灭菌柜
                  } else if (originalSendTo.startsWith('B1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `B2-${suffix}`;
                  } else if (originalSendTo.startsWith('C1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `B2-${suffix}`; // 进入B灭菌柜
                  }
                }

                this.addLog(
                  `托盘 ${tray.trayCode} 离开预热间 ${tray.preheatingRoom}，进入灭菌间 B2，时间：${currentTime}，目标位置：${tray.sendTo}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outPreheatingRoomTime: currentTime,
                  sterilizationRoom: 'B2',
                  inSterilizationRoomTime: currentTime
                });
                this.queues[7].trayInfo.push(tray);
                sourceQueue.trayInfo.shift();
              }
            }
          }
        } else {
          // 不是设置发往B2的，但是B2却增加了，说明有问题，直接报警
          this.addLog('未设置发送到B2，程序错误！报警！');
        }
      }
      // 动态更新与写入：解析需求
      if (this.warehouseSelectedFrom === 'B') {
        this.updateAnalysisNeedAndWrite();
      }
      // 检查是否需要停止执行：如果目的地队列数量等于目标总数量
      if (
        this.disinfectionRoomSelectedTo === 'B' &&
        this.disinfectionExecuting
      ) {
        if (newVal === this.disinfectionTargetTotal) {
          this.cancelDisinfectionRoom();
          this.addLog(
            `预热房到灭菌柜执行完成，目的地B2队列数量达到目标总数量${this.disinfectionTargetTotal}，已自动停止执行`
          );
        }
      }
      // 检查目的地限制 - 只有当当前选择的灭菌房目的地是B时才检查
      if (this.disinfectionRoomSelectedTo === 'B') {
        this.checkDestinationLimit();
      }
    },
    // 监视C2数量变化
    'cLineQuantity.c2'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        const increaseCount = newVal - oldVal;
        // 先判断当前选择发送的是C2么
        if (this.disinfectionRoomSelectedTo === 'C') {
          let sourceQueueIndex;
          let sourceName;
          // 看看C2是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.disinfectionRoomSelectedFrom === 'A') {
            sourceQueueIndex = 3; // A1队列
            sourceName = 'A1';
          } else if (this.disinfectionRoomSelectedFrom === 'B') {
            sourceQueueIndex = 4; // B1队列
            sourceName = 'B1';
          } else if (this.disinfectionRoomSelectedFrom === 'C') {
            sourceQueueIndex = 5; // C1队列
            sourceName = 'C1';
          }

          if (sourceQueueIndex !== undefined) {
            const sourceQueue = this.queues[sourceQueueIndex];
            const availableTrays = sourceQueue.trayInfo || [];

            if (availableTrays.length >= increaseCount) {
              // 批量移动托盘
              for (let i = 0; i < increaseCount; i++) {
                if (sourceQueue.trayInfo.length > 0) {
                  const tray = sourceQueue.trayInfo[0];
                  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                  this.$set(tray, 'outPreheatingRoomTime', currentTime);
                  this.$set(tray, 'sterilizationRoom', 'C2');
                  this.$set(tray, 'inSterilizationRoomTime', currentTime);

                  // 计算灭菌柜的sendTo编号：A1-1→C2-1, A1-2→C2-2
                  if (tray.sendTo) {
                    const originalSendTo = tray.sendTo;
                    if (originalSendTo.startsWith('A1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `C2-${suffix}`; // 进入C灭菌柜
                    } else if (originalSendTo.startsWith('B1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `C2-${suffix}`; // 进入C灭菌柜
                    } else if (originalSendTo.startsWith('C1-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `C2-${suffix}`;
                    }
                  }

                  this.addLog(
                    `托盘 ${tray.trayCode} 离开预热间 ${tray.preheatingRoom}，进入灭菌间 C2，时间：${currentTime}，目标位置：${tray.sendTo}`
                  );
                  // 更新到后台
                  this.updateTrayInfo(tray, {
                    outPreheatingRoomTime: currentTime,
                    sterilizationRoom: 'C2',
                    inSterilizationRoomTime: currentTime
                  });
                  this.queues[8].trayInfo.push(tray);
                  sourceQueue.trayInfo.shift();
                }
              }
              this.addLog(
                `从${sourceName}队列移动${increaseCount}个托盘到C2队列`
              );
            } else {
              this.addLog(
                `C2队列数量增加${increaseCount}，但${sourceName}队列托盘不足，仅移动${availableTrays.length}个托盘`
              );
              // 移动所有可用的托盘
              while (sourceQueue.trayInfo.length > 0) {
                const tray = sourceQueue.trayInfo[0];
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                this.$set(tray, 'outPreheatingRoomTime', currentTime);
                this.$set(tray, 'sterilizationRoom', 'C2');
                this.$set(tray, 'inSterilizationRoomTime', currentTime);

                // 计算灭菌柜的sendTo编号：A1-1→C2-1, A1-2→C2-2
                if (tray.sendTo) {
                  const originalSendTo = tray.sendTo;
                  if (originalSendTo.startsWith('A1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `C2-${suffix}`; // 进入C灭菌柜
                  } else if (originalSendTo.startsWith('B1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `C2-${suffix}`; // 进入C灭菌柜
                  } else if (originalSendTo.startsWith('C1-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `C2-${suffix}`;
                  }
                }

                this.addLog(
                  `托盘 ${tray.trayCode} 离开预热间 ${tray.preheatingRoom}，进入灭菌间 C2，时间：${currentTime}，目标位置：${tray.sendTo}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outPreheatingRoomTime: currentTime,
                  sterilizationRoom: 'C2',
                  inSterilizationRoomTime: currentTime
                });
                this.queues[8].trayInfo.push(tray);
                sourceQueue.trayInfo.shift();
              }
            }
          }
        } else {
          // 不是设置发往C2的，但是C2却增加了，说明有问题，直接报警
          this.addLog('未设置发送到C2，程序错误！报警！');
        }
      }
      // 动态更新与写入：解析需求
      if (this.warehouseSelectedFrom === 'C') {
        this.updateAnalysisNeedAndWrite();
      }
      // 检查是否需要停止执行：如果目的地队列数量等于目标总数量
      if (
        this.disinfectionRoomSelectedTo === 'C' &&
        this.disinfectionExecuting
      ) {
        if (newVal === this.disinfectionTargetTotal) {
          this.cancelDisinfectionRoom();
          this.addLog(
            `预热房到灭菌柜执行完成，目的地C2队列数量达到目标总数量${this.disinfectionTargetTotal}，已自动停止执行`
          );
        }
      }
      // 检查目的地限制 - 只有当当前选择的灭菌房目的地是C时才检查
      if (this.disinfectionRoomSelectedTo === 'C') {
        this.checkDestinationLimit();
      }
    },
    // 监听A3数量变化
    'aLineQuantity.a3'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        const increaseCount = newVal - oldVal;
        // 先判断当前选择发送的是A3么
        if (this.warehouseSelectedTo === 'A') {
          let sourceQueueIndex;
          let sourceName;
          // 看看A3是从warehouseSelectedFrom哪个口发过来
          if (this.warehouseSelectedFrom === 'A') {
            sourceQueueIndex = 6; // A2队列
            sourceName = 'A2';
          } else if (this.warehouseSelectedFrom === 'B') {
            sourceQueueIndex = 7; // B2队列
            sourceName = 'B2';
          } else if (this.warehouseSelectedFrom === 'C') {
            sourceQueueIndex = 8; // C2队列
            sourceName = 'C2';
          }

          if (sourceQueueIndex !== undefined) {
            const sourceQueue = this.queues[sourceQueueIndex];
            const availableTrays = sourceQueue.trayInfo || [];

            if (availableTrays.length >= increaseCount) {
              // 批量移动托盘
              for (let i = 0; i < increaseCount; i++) {
                if (sourceQueue.trayInfo.length > 0) {
                  const tray = sourceQueue.trayInfo[0];
                  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                  this.$set(tray, 'outSterilizationRoomTime', currentTime);
                  this.$set(tray, 'analysisRoom', 'A3');
                  this.$set(tray, 'inAnalysisRoomTime', currentTime);

                  // 计算解析柜的sendTo编号：A2-1→A3-1, A2-2→A3-2
                  if (tray.sendTo) {
                    const originalSendTo = tray.sendTo;
                    if (originalSendTo.startsWith('A2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `A3-${suffix}`;
                    } else if (originalSendTo.startsWith('B2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `A3-${suffix}`; // 进入A解析柜
                    } else if (originalSendTo.startsWith('C2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `A3-${suffix}`; // 进入A解析柜
                    }
                  }

                  this.addLog(
                    `托盘 ${tray.trayCode} 离开灭菌间 ${tray.sterilizationRoom}，进入解析间 A3，时间：${currentTime}，目标位置：${tray.sendTo}`
                  );
                  // 更新到后台
                  this.updateTrayInfo(tray, {
                    outSterilizationRoomTime: currentTime,
                    analysisRoom: 'A3',
                    inAnalysisRoomTime: currentTime
                  });
                  this.queues[9].trayInfo.push(tray);
                  sourceQueue.trayInfo.shift();
                }
              }
              this.addLog(
                `从${sourceName}队列移动${increaseCount}个托盘到A3队列`
              );
            } else {
              this.addLog(
                `A3队列数量增加${increaseCount}，但${sourceName}队列托盘不足，仅移动${availableTrays.length}个托盘`
              );
              // 移动所有可用的托盘
              while (sourceQueue.trayInfo.length > 0) {
                const tray = sourceQueue.trayInfo[0];
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                this.$set(tray, 'outSterilizationRoomTime', currentTime);
                this.$set(tray, 'analysisRoom', 'A3');
                this.$set(tray, 'inAnalysisRoomTime', currentTime);

                // 计算解析柜的sendTo编号：A2-1→A3-1, A2-2→A3-2
                if (tray.sendTo) {
                  const originalSendTo = tray.sendTo;
                  if (originalSendTo.startsWith('A2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `A3-${suffix}`;
                  } else if (originalSendTo.startsWith('B2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `A3-${suffix}`; // 进入A解析柜
                  } else if (originalSendTo.startsWith('C2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `A3-${suffix}`; // 进入A解析柜
                  }
                }

                this.addLog(
                  `托盘 ${tray.trayCode} 离开灭菌间 ${tray.sterilizationRoom}，进入解析间 A3，时间：${currentTime}，目标位置：${tray.sendTo}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outSterilizationRoomTime: currentTime,
                  analysisRoom: 'A3',
                  inAnalysisRoomTime: currentTime
                });
                this.queues[9].trayInfo.push(tray);
                sourceQueue.trayInfo.shift();
              }
            }
          }
        } else {
          // 不是设置发往A3的，但是A3却增加了，说明有问题，直接报警
          this.addLog('未设置发送到A3，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        const decreaseCount = oldVal - newVal;
        if (newVal < oldVal) {
          // 先判断当前选择出库的是A3么
          if (this.outWarehouseSelected === 'A') {
            // 批量处理出库托盘
            for (let i = 0; i < decreaseCount; i++) {
              if (this.queues[9].trayInfo.length > 0) {
                // 把A3队列的第一个元素数据展示到下货
                const tray = this.queues[9].trayInfo[0];
                this.addLog(`托盘信息：${tray.trayCode} 出库`);
                this.currentOutTrayInfo = tray;
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                this.$set(tray, 'outAnalysisRoomTime', currentTime);
                this.addLog(
                  `托盘 ${tray.trayCode} 离开解析间 ${tray.analysisRoom}，时间：${currentTime}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outAnalysisRoomTime: currentTime
                });
                // 删除A3队列的第一个元素
                this.queues[9].trayInfo.shift();
                // 更新订单状态为已完成
                this.updateOrderStatus(tray);
              } else {
                this.addLog('A3队列空，无法出库');
                break;
              }
            }
          } else {
            // 不是设置出库A3的，但是A3却减少了，说明有问题，直接报警
            this.addLog('未设置出库A3，程序错误！报警！');
          }
        }
      }
      // 检查是否需要停止执行：如果目的地队列数量等于目标总数量
      if (this.warehouseSelectedTo === 'A' && this.analysisExecuting) {
        if (newVal === this.analysisTargetTotal) {
          this.cancelAnalysisRoom();
          this.addLog(
            `灭菌柜到解析房执行完成，目的地A3队列数量达到目标总数量${this.analysisTargetTotal}，已自动停止执行`
          );
        }
      }
      // 检查目的地限制 - 只有当当前选择的解析库目的地是A时才检查
      if (this.warehouseSelectedTo === 'A') {
        this.checkDestinationLimit();
      }
      // 如果当前选择出库A，更新出库需进货
      if (this.outWarehouseSelected === 'A') {
        this.updateOutNeedAndWrite();
      }
    },
    // 监听B3数量变化
    'bLineQuantity.b3'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        const increaseCount = newVal - oldVal;
        // 先判断当前选择发送的是B3么
        if (this.warehouseSelectedTo === 'B') {
          let sourceQueueIndex;
          let sourceName;
          // 看看B3是从warehouseSelectedFrom哪个口发过来
          if (this.warehouseSelectedFrom === 'A') {
            sourceQueueIndex = 6; // A2队列
            sourceName = 'A2';
          } else if (this.warehouseSelectedFrom === 'B') {
            sourceQueueIndex = 7; // B2队列
            sourceName = 'B2';
          } else if (this.warehouseSelectedFrom === 'C') {
            sourceQueueIndex = 8; // C2队列
            sourceName = 'C2';
          }

          if (sourceQueueIndex !== undefined) {
            const sourceQueue = this.queues[sourceQueueIndex];
            const availableTrays = sourceQueue.trayInfo || [];

            if (availableTrays.length >= increaseCount) {
              // 批量移动托盘
              for (let i = 0; i < increaseCount; i++) {
                if (sourceQueue.trayInfo.length > 0) {
                  const tray = sourceQueue.trayInfo[0];
                  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                  this.$set(tray, 'outSterilizationRoomTime', currentTime);
                  this.$set(tray, 'analysisRoom', 'B3');
                  this.$set(tray, 'inAnalysisRoomTime', currentTime);

                  // 计算解析柜的sendTo编号：A2-1→B3-1, A2-2→B3-2
                  if (tray.sendTo) {
                    const originalSendTo = tray.sendTo;
                    if (originalSendTo.startsWith('A2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `B3-${suffix}`; // 进入B解析柜
                    } else if (originalSendTo.startsWith('B2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `B3-${suffix}`;
                    } else if (originalSendTo.startsWith('C2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `B3-${suffix}`; // 进入B解析柜
                    }
                  }

                  this.addLog(
                    `托盘 ${tray.trayCode} 离开灭菌间 ${tray.sterilizationRoom}，进入解析间 B3，时间：${currentTime}，目标位置：${tray.sendTo}`
                  );
                  // 更新到后台
                  this.updateTrayInfo(tray, {
                    outSterilizationRoomTime: currentTime,
                    analysisRoom: 'B3',
                    inAnalysisRoomTime: currentTime
                  });
                  this.queues[10].trayInfo.push(tray);
                  sourceQueue.trayInfo.shift();
                }
              }
              this.addLog(
                `从${sourceName}队列移动${increaseCount}个托盘到B3队列`
              );
            } else {
              this.addLog(
                `B3队列数量增加${increaseCount}，但${sourceName}队列托盘不足，仅移动${availableTrays.length}个托盘`
              );
              // 移动所有可用的托盘
              while (sourceQueue.trayInfo.length > 0) {
                const tray = sourceQueue.trayInfo[0];
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                // 记录离开灭菌间和进入解析间的时间
                this.$set(tray, 'outSterilizationRoomTime', currentTime);
                this.$set(tray, 'analysisRoom', 'B3');
                this.$set(tray, 'inAnalysisRoomTime', currentTime);

                // 计算解析柜的sendTo编号：A2-1→B3-1, A2-2→B3-2
                if (tray.sendTo) {
                  const originalSendTo = tray.sendTo;
                  if (originalSendTo.startsWith('A2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `B3-${suffix}`; // 进入B解析柜
                  } else if (originalSendTo.startsWith('B2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `B3-${suffix}`;
                  } else if (originalSendTo.startsWith('C2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `B3-${suffix}`; // 进入B解析柜
                  }
                }

                this.addLog(
                  `托盘 ${tray.trayCode} 离开灭菌间 ${tray.sterilizationRoom}，进入解析间 B3，时间：${currentTime}，目标位置：${tray.sendTo}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outSterilizationRoomTime: currentTime,
                  analysisRoom: 'B3',
                  inAnalysisRoomTime: currentTime
                });
                this.queues[10].trayInfo.push(tray);
                sourceQueue.trayInfo.shift();
              }
            }
          }
        } else {
          // 不是设置发往B3的，但是B3却增加了，说明有问题，直接报警
          this.addLog('未设置发送到B3，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        const decreaseCount = oldVal - newVal;
        if (newVal < oldVal) {
          // 先判断当前选择出库的是B3么
          if (this.outWarehouseSelected === 'B') {
            // 批量处理出库托盘
            for (let i = 0; i < decreaseCount; i++) {
              if (this.queues[10].trayInfo.length > 0) {
                // 把B3队列的第一个元素数据展示到下货
                const tray = this.queues[10].trayInfo[0];
                this.addLog(`托盘信息：${tray.trayCode} 出库`);
                this.currentOutTrayInfo = tray;
                // 记录离开解析间的时间
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                this.$set(tray, 'outAnalysisRoomTime', currentTime);
                this.addLog(
                  `托盘 ${tray.trayCode} 离开解析间 ${tray.analysisRoom}，时间：${currentTime}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outAnalysisRoomTime: currentTime
                });
                // 删除B3队列的第一个元素
                this.queues[10].trayInfo.shift();
                // 更新订单状态为已完成
                this.updateOrderStatus(tray);
              } else {
                this.addLog('B3队列空，无法出库');
                break;
              }
            }
          } else {
            // 不是设置出库B3的，但是B3却减少了，说明有问题，直接报警
            this.addLog('未设置出库B3，程序错误！报警！');
          }
        }
      }
      // 检查是否需要停止执行：如果目的地队列数量等于目标总数量
      if (this.warehouseSelectedTo === 'B' && this.analysisExecuting) {
        if (newVal === this.analysisTargetTotal) {
          this.cancelAnalysisRoom();
          this.addLog(
            `灭菌柜到解析房执行完成，目的地B3队列数量达到目标总数量${this.analysisTargetTotal}，已自动停止执行`
          );
        }
      }
      // 检查目的地限制 - 只有当当前选择的解析库目的地是B时才检查
      if (this.warehouseSelectedTo === 'B') {
        this.checkDestinationLimit();
      }
      // 如果当前选择出库B，更新出库需进货
      if (this.outWarehouseSelected === 'B') {
        this.updateOutNeedAndWrite();
      }
    },
    // 监听C3数量变化
    'cLineQuantity.c3'(newVal, oldVal) {
      // 只有在数据准备就绪后才执行监听逻辑
      if (!this.isDataReady) return;
      // 使用增量计算来处理多个托盘
      if (newVal > oldVal) {
        const increaseCount = newVal - oldVal;
        // 先判断当前选择发送的是C3么
        if (this.warehouseSelectedTo === 'C') {
          let sourceQueueIndex;
          let sourceName;
          // 看看C3是从warehouseSelectedFrom哪个口发过来
          if (this.warehouseSelectedFrom === 'A') {
            sourceQueueIndex = 6; // A2队列
            sourceName = 'A2';
          } else if (this.warehouseSelectedFrom === 'B') {
            sourceQueueIndex = 7; // B2队列
            sourceName = 'B2';
          } else if (this.warehouseSelectedFrom === 'C') {
            sourceQueueIndex = 8; // C2队列
            sourceName = 'C2';
          }

          if (sourceQueueIndex !== undefined) {
            const sourceQueue = this.queues[sourceQueueIndex];
            const availableTrays = sourceQueue.trayInfo || [];

            if (availableTrays.length >= increaseCount) {
              // 批量移动托盘
              for (let i = 0; i < increaseCount; i++) {
                if (sourceQueue.trayInfo.length > 0) {
                  const tray = sourceQueue.trayInfo[0];
                  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                  this.$set(tray, 'outSterilizationRoomTime', currentTime);
                  this.$set(tray, 'analysisRoom', 'C3');
                  this.$set(tray, 'inAnalysisRoomTime', currentTime);

                  // 计算解析柜的sendTo编号：A2-1→C3-1, A2-2→C3-2
                  if (tray.sendTo) {
                    const originalSendTo = tray.sendTo;
                    if (originalSendTo.startsWith('A2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `C3-${suffix}`; // 进入C解析柜
                    } else if (originalSendTo.startsWith('B2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `C3-${suffix}`; // 进入C解析柜
                    } else if (originalSendTo.startsWith('C2-')) {
                      const suffix = originalSendTo.substring(3); // 获取-1或-2
                      tray.sendTo = `C3-${suffix}`;
                    }
                  }

                  this.addLog(
                    `托盘 ${tray.trayCode} 离开灭菌间 ${tray.sterilizationRoom}，进入解析间 C3，时间：${currentTime}，目标位置：${tray.sendTo}`
                  );
                  // 更新到后台
                  this.updateTrayInfo(tray, {
                    outSterilizationRoomTime: currentTime,
                    analysisRoom: 'C3',
                    inAnalysisRoomTime: currentTime
                  });
                  this.queues[11].trayInfo.push(tray);
                  sourceQueue.trayInfo.shift();
                }
              }
              this.addLog(
                `从${sourceName}队列移动${increaseCount}个托盘到C3队列`
              );
            } else {
              this.addLog(
                `C3队列数量增加${increaseCount}，但${sourceName}队列托盘不足，仅移动${availableTrays.length}个托盘`
              );
              // 移动所有可用的托盘
              while (sourceQueue.trayInfo.length > 0) {
                const tray = sourceQueue.trayInfo[0];
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                // 记录离开灭菌间和进入解析间的时间
                this.$set(tray, 'outSterilizationRoomTime', currentTime);
                this.$set(tray, 'analysisRoom', 'C3');
                this.$set(tray, 'inAnalysisRoomTime', currentTime);

                // 计算解析柜的sendTo编号：A2-1→C3-1, A2-2→C3-2
                if (tray.sendTo) {
                  const originalSendTo = tray.sendTo;
                  if (originalSendTo.startsWith('A2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `C3-${suffix}`; // 进入C解析柜
                  } else if (originalSendTo.startsWith('B2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `C3-${suffix}`; // 进入C解析柜
                  } else if (originalSendTo.startsWith('C2-')) {
                    const suffix = originalSendTo.substring(3); // 获取-1或-2
                    tray.sendTo = `C3-${suffix}`;
                  }
                }

                this.addLog(
                  `托盘 ${tray.trayCode} 离开灭菌间 ${tray.sterilizationRoom}，进入解析间 C3，时间：${currentTime}，目标位置：${tray.sendTo}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outSterilizationRoomTime: currentTime,
                  analysisRoom: 'C3',
                  inAnalysisRoomTime: currentTime
                });
                this.queues[11].trayInfo.push(tray);
                sourceQueue.trayInfo.shift();
              }
            }
          }
        } else {
          // 不是设置发往C3的，但是C3却增加了，说明有问题，直接报警
          this.addLog('未设置发送到C3，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        const decreaseCount = oldVal - newVal;
        if (newVal < oldVal) {
          // 先判断当前选择出库的是C3么
          if (this.outWarehouseSelected === 'C') {
            // 批量处理出库托盘
            for (let i = 0; i < decreaseCount; i++) {
              if (this.queues[11].trayInfo.length > 0) {
                // 把C3队列的第一个元素数据展示到下货
                const tray = this.queues[11].trayInfo[0];
                this.addLog(`托盘信息：${tray.trayCode} 出库`);
                this.currentOutTrayInfo = tray;

                // 记录离开解析间的时间
                const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
                this.$set(tray, 'outAnalysisRoomTime', currentTime);
                this.addLog(
                  `托盘 ${tray.trayCode} 离开解析间 ${tray.analysisRoom}，时间：${currentTime}`
                );
                // 更新到后台
                this.updateTrayInfo(tray, {
                  outAnalysisRoomTime: currentTime
                });

                // 删除C3队列的第一个元素
                this.queues[11].trayInfo.shift();
                // 更新订单状态为已完成
                this.updateOrderStatus(tray);
              } else {
                this.addLog('C3队列空，无法出库');
                break;
              }
            }
          } else {
            // 不是设置出库C3的，但是C3却减少了，说明有问题，直接报警
            this.addLog('未设置出库C3，程序错误！报警！');
          }
        }
      }
      // 检查是否需要停止执行：如果目的地队列数量等于目标总数量
      if (this.warehouseSelectedTo === 'C' && this.analysisExecuting) {
        if (newVal === this.analysisTargetTotal) {
          this.cancelAnalysisRoom();
          this.addLog(
            `灭菌柜到解析房执行完成，目的地C3队列数量达到目标总数量${this.analysisTargetTotal}，已自动停止执行`
          );
        }
      }
      // 检查目的地限制 - 只有当当前选择的解析库目的地是C时才检查
      if (this.warehouseSelectedTo === 'C') {
        this.checkDestinationLimit();
      }
      // 如果当前选择出库C，更新出库需进货
      if (this.outWarehouseSelected === 'C') {
        this.updateOutNeedAndWrite();
      }
    },
    // D/E 上货数量变更逻辑取消：扫码即入队，无需区分已入队/实际入队
    // D下货数量变化：0->N 时移动所有在队托盘到D出货队列；减少时按数量出货
    dDisinfectionOutQuantity(newVal, oldVal) {
      // 从0增加到某个数：把已实际入队的托盘全部移到下货队列
      if (oldVal === 0 && newVal > 0) {
        const upQueue = this.queues[12];
        const downQueue = this.queues[15];
        if (upQueue.trayInfo.length > 0) {
          const moveCount = upQueue.trayInfo.length;
          // 直接移动所有托盘，不需要过滤
          upQueue.trayInfo.forEach((t) => downQueue.trayInfo.push(t));
          upQueue.trayInfo = [];
          this.addLog(
            `D下货数量从0到${newVal}，移动${moveCount}个托盘到D出货队列`
          );

          // 上下货队列移动时，发送不允许上货
          this.allowUploadD = false;
          this.handleAllowUpload('D');
          // 显示提示消息
          this.$message({
            message: 'D灭菌柜已完成上下货队列移动，自动取消上货允许',
            type: 'info',
            duration: 3000,
            showClose: true
          });
        } else {
          this.addLog('D下货数量从0增加，但上货队列无托盘可移动');
        }
      }
      // DE出货不再监听队列数量减少，改为收到出货请求再进行出货
    },
    // E下货数量变化：0->N 时移动所有在队托盘到E出货队列；减少时按数量出货
    eDisinfectionOutQuantity(newVal, oldVal) {
      if (oldVal === 0 && newVal > 0) {
        const upQueue = this.queues[13];
        const downQueue = this.queues[16];
        if (upQueue.trayInfo.length > 0) {
          const moveCount = upQueue.trayInfo.length;
          // 直接移动所有托盘，不需要过滤
          upQueue.trayInfo.forEach((t) => downQueue.trayInfo.push(t));
          upQueue.trayInfo = [];
          this.addLog(
            `E下货数量从0到${newVal}，移动${moveCount}个托盘到E出货队列`
          );

          // 上下货队列移动时，发送不允许上货
          this.allowUploadE = false;
          this.handleAllowUpload('E');
          // 显示提示消息
          this.$message({
            message: 'E灭菌柜已完成上下货队列移动，自动取消上货允许',
            type: 'info',
            duration: 3000,
            showClose: true
          });
        } else {
          this.addLog('E下货数量从0增加，但上货队列无托盘可移动');
        }
      }
    },
    // 监听D/E出货请求信号：1则发送对应出货命令并执行出货逻辑
    dDisinfectionOutSignal(newVal, oldVal) {
      if (newVal === 1 && oldVal !== 1) {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 1);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW536');
        }, 2000);
        this.addLog('收到D出货请求信号，已发送D出货命令');

        // 执行D出货逻辑
        if (this.queues[15].trayInfo.length > 0) {
          const tray = this.queues[15].trayInfo[0];
          this.addLog(`托盘信息：${tray.trayCode} 出库`);
          this.currentOutTrayInfo = tray;
          // 更新出库选择状态为D，状态变为执行中
          this.outWarehouseSelected = 'D';
          this.outWarehouseLoading = true;
          this.outWarehouseExecuting = true;
          this.outWarehouseTrayCode = tray.trayCode;
          this.queues[15].trayInfo.shift();
          // 更新需进货数量并写入PLC
          this.updateOutNeedAndWrite();
          this.callWmsUnloadGoods(tray.trayCode, 1, 'D');
          // 更新订单状态为已完成
          this.updateOrderStatus(tray);
        } else {
          this.addLog('D出货队列空，无法出库');
        }
      }
    },
    eDisinfectionOutSignal(newVal, oldVal) {
      if (newVal === 1 && oldVal !== 1) {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 2);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW536');
        }, 2000);
        this.addLog('收到E出货请求信号，已发送E出货命令');

        // 执行E出货逻辑
        if (this.queues[16].trayInfo.length > 0) {
          const tray = this.queues[16].trayInfo[0];
          this.addLog(`托盘信息：${tray.trayCode} 出库`);
          this.currentOutTrayInfo = tray;
          // 更新出库选择状态为E，状态变为执行中
          this.outWarehouseSelected = 'E';
          this.outWarehouseLoading = true;
          this.outWarehouseExecuting = true;
          this.outWarehouseTrayCode = tray.trayCode;
          this.queues[16].trayInfo.shift();
          // 更新需进货数量并写入PLC
          this.updateOutNeedAndWrite();
          this.callWmsUnloadGoods(tray.trayCode, 1, 'E');
          // 更新订单状态为已完成
          this.updateOrderStatus(tray);
        } else {
          this.addLog('E出货队列空，无法出库');
        }
      }
    },
    // ---- 新增：监听小车位置数值变化 ----
    'cartPositionValues.cart1'(newVal) {
      this.updateCartPositionByValue(1, newVal);
    },
    'cartPositionValues.cart2'(newVal) {
      this.updateCartPositionByValue(2, newVal);
    },
    'cartPositionValues.cart3'(newVal) {
      this.updateCartPositionByValue(3, newVal);
    },
    'cartPositionValues.cart4'(newVal) {
      this.updateCartPositionByValue(4, newVal);
    },
    // ---- 监听小车位置数值变化结束 ----

    // ---- 新增：监听指定队列的 trayInfo 变化 ----
    'queues.0.trayInfo': {
      // 监听上货区 (ID: 1)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(1);
      }
    },
    'queues.1.trayInfo': {
      // 监听分发区 (ID: 2)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(2);
      }
    },
    'queues.2.trayInfo': {
      // 监听缓存区 (ID: 3)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(3);
      }
    },
    'queues.3.trayInfo': {
      // 监听 A1 (ID: 4)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(4);
      }
    },
    'queues.4.trayInfo': {
      // 监听 B1 (ID: 5)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(5);
      }
    },
    'queues.5.trayInfo': {
      // 监听 C1 (ID: 6)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(6);
      }
    },
    'queues.6.trayInfo': {
      // 监听 A2 (ID: 7)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(7);
      }
    },
    'queues.7.trayInfo': {
      // 监听 B2 (ID: 8)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(8);
      }
    },
    'queues.8.trayInfo': {
      // 监听 C2 (ID: 9)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(9);
      }
    },
    'queues.9.trayInfo': {
      // 监听 A3 (ID: 10)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(10);
      }
    },
    'queues.10.trayInfo': {
      // 监听 B3 (ID: 11)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(11);
      }
    },
    'queues.11.trayInfo': {
      // 监听 C3 (ID: 12)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(12);
      }
    },
    'queues.12.trayInfo': {
      // 监听 D (ID: 13)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(13);
      }
    },
    'queues.13.trayInfo': {
      // 监听 E (ID: 14)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(14);
      }
    },
    'queues.14.trayInfo': {
      // 监听非灭菌缓存区 (ID: 15)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(15);
      }
    },
    'queues.15.trayInfo': {
      // 监听 D出货 (ID: 16)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(16);
      }
    },
    'queues.16.trayInfo': {
      // 监听 E出货 (ID: 17)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(17);
      }
    },
    // 监听D灭菌柜上货数量变化，重新计算需进货数量
    dDisinfectionInQuantity(newVal, oldVal) {
      if (!this.isDataReady) return;
      // 只有在上货数量增加时才重新计算
      if (newVal > oldVal && this.dExecuting && this.dExecQty) {
        const arrived = Number(newVal) || 0;
        const need = Math.max(0, Number(this.dExecQty) - arrived);
        this.dNeedQty = need;
        this.addLog(
          `D灭菌柜上货数量增加到${newVal}，重新计算需进货数量: ${need}`
        );
        this.writeWordWithCancel('DBW552', need);

        // 检查D上货数量是否达到8，如果达到则自动取消上货执行
        if (this.dDisinfectionInQuantity >= 8) {
          this.allowUploadD = false;
          this.handleAllowUpload('D');
          this.addLog('D上货数量达到8，自动取消上货执行');
          this.$message.warning('D上货队列已满，自动取消上货执行');
        }
      }
    },
    // 监听E灭菌柜上货数量变化，重新计算需进货数量
    eDisinfectionInQuantity(newVal, oldVal) {
      if (!this.isDataReady) return;
      // 只有在上货数量增加时才重新计算
      if (newVal > oldVal && this.eExecuting && this.eExecQty) {
        const arrived = Number(newVal) || 0;
        const need = Math.max(0, Number(this.eExecQty) - arrived);
        this.eNeedQty = need;
        this.addLog(
          `E灭菌柜上货数量增加到${newVal}，重新计算需进货数量: ${need}`
        );
        this.writeWordWithCancel('DBW554', need);

        // 检查E上货数量是否达到8，如果达到则自动取消上货执行
        if (this.eDisinfectionInQuantity >= 8) {
          this.allowUploadE = false;
          this.handleAllowUpload('E');
          this.addLog('E上货数量达到8，自动取消上货执行');
          this.$message.warning('E上货队列已满，自动取消上货执行');
        }
      }
    }
  },
  methods: {
    // 检查报警点位变化并触发报警
    checkAlarmPoints(oldAlarmPoints) {
      if (!this.isDataReady) return;

      // 使用与其它点位相同的bit处理逻辑
      const getBit = (word, bitIndex) => ((word >> bitIndex) & 1).toString();

      // 遍历所有报警点位，检查位变化
      Object.keys(this.alarmPoints).forEach((address) => {
        const newValue = this.alarmPoints[address];
        const oldValue = oldAlarmPoints[address];

        // 比较具体的值而不是对象引用
        if (newValue !== oldValue) {
          // 检查每一位的变化 (按照其他点位的bit映射规则)
          for (let bit = 0; bit < 16; bit++) {
            let bitIndex;
            if (bit < 8) {
              // bit0-bit7: 使用bitIndex=8-15
              bitIndex = bit + 8;
            } else {
              // bit8-bit15: 使用bitIndex=0-7
              bitIndex = bit - 8;
            }

            const newBit = getBit(newValue, bitIndex);
            const oldBit = getBit(oldValue, bitIndex);

            // 如果位从0变为1，触发报警
            if (oldBit === '0' && newBit === '1') {
              const dbAddress = `DB101.${address}`;
              const bitKey = `bit${bitIndex}`;
              const alarmMessage = this.alarmMapping[dbAddress]?.[bitKey];

              if (alarmMessage && alarmMessage.trim() !== '') {
                this.addLog(`报警: ${alarmMessage}`, 'alarm');
              }
            }
          }
        }
      });
    },
    // 更新订单状态为已完成
    async updateOrderStatus(tray) {
      if (!tray || !tray.orderId || !tray.trayCode || !tray.mainId) {
        this.addLog(
          `订单状态更新失败：托盘信息不完整或为无码模式上货 - 订单号: ${tray?.orderId}, 托盘号: ${tray?.trayCode}, 主键: ${tray?.mainId}`
        );
        return;
      }

      try {
        const params = {
          id: tray.mainId,
          finishTime: moment().format('YYYY-MM-DD HH:mm:ss'),
          orderStatus: 1
        };
        this.addLog(
          `出库回更订单，托盘号：${tray.trayCode}，订单号：${tray.orderId}，主键：${tray.mainId}`
        );
        const response = await HttpUtil.post('/order/update', params);
        if (response && response.data === 1) {
          this.addLog(
            `订单 ${tray.orderId}，托盘号 ${tray.trayCode} 状态更新成功，已标记为已完成`
          );
        } else {
          this.addLog(
            `订单 ${tray.orderId}，托盘号 ${tray.trayCode} 状态更新失败：接口返回数据异常`
          );
        }
      } catch (error) {
        this.addLog(
          `订单 ${tray.orderId}，托盘号 ${tray.trayCode} 状态更新异常: ${error.message}`
        );
      }
    },
    // 更新托盘预热、灭菌、解析信息到后台
    async updateTrayInfo(tray, updateFields = {}) {
      if (!tray || !tray.mainId || !tray.trayCode) {
        this.addLog(
          `托盘信息更新失败：托盘信息不完整 - 托盘号: ${tray?.trayCode}, 主键: ${tray?.mainId}`
        );
        return;
      }

      try {
        const params = {
          id: tray.mainId,
          // 预热间信息
          preheatingRoom:
            updateFields.preheatingRoom !== undefined
              ? updateFields.preheatingRoom
              : tray.preheatingRoom,
          inPreheatingRoomTime:
            updateFields.inPreheatingRoomTime !== undefined
              ? updateFields.inPreheatingRoomTime
              : tray.inPreheatingRoomTime,
          outPreheatingRoomTime:
            updateFields.outPreheatingRoomTime !== undefined
              ? updateFields.outPreheatingRoomTime
              : tray.outPreheatingRoomTime,
          // 灭菌间信息
          sterilizationRoom:
            updateFields.sterilizationRoom !== undefined
              ? updateFields.sterilizationRoom
              : tray.sterilizationRoom,
          inSterilizationRoomTime:
            updateFields.inSterilizationRoomTime !== undefined
              ? updateFields.inSterilizationRoomTime
              : tray.inSterilizationRoomTime,
          outSterilizationRoomTime:
            updateFields.outSterilizationRoomTime !== undefined
              ? updateFields.outSterilizationRoomTime
              : tray.outSterilizationRoomTime,
          // 解析间信息
          analysisRoom:
            updateFields.analysisRoom !== undefined
              ? updateFields.analysisRoom
              : tray.analysisRoom,
          inAnalysisRoomTime:
            updateFields.inAnalysisRoomTime !== undefined
              ? updateFields.inAnalysisRoomTime
              : tray.inAnalysisRoomTime,
          outAnalysisRoomTime:
            updateFields.outAnalysisRoomTime !== undefined
              ? updateFields.outAnalysisRoomTime
              : tray.outAnalysisRoomTime
        };

        this.addLog(
          `更新托盘信息，托盘号：${tray.trayCode}，主键：${tray.mainId}`
        );

        const response = await HttpUtil.post('/order/update', params);
        if (response && response.data === 1) {
          this.addLog(`托盘 ${tray.trayCode} 信息更新成功`);
        } else {
          this.addLog(`托盘 ${tray.trayCode} 信息更新失败：接口返回数据异常`);
        }
      } catch (error) {
        this.addLog(`托盘 ${tray.trayCode} 信息更新异常: ${error.message}`);
      }
    },
    // 取消预热房执行
    cancelPreheatingRoom() {
      this.preheatingRoomLoading = false;
      this.preheatingRoomSelected = null;
      this.preheatExecQty = undefined;
      this.preheatNeedQty = 0;
      this.preheatExecuting = false;
      this.preWarmTrayCode = '';
      this.writeWordWithCancel('DBW546', 0);
      this.addLog('预热房选择已取消，切换为不执行状态');
    },
    // 取消预热房到灭菌柜执行
    cancelDisinfectionRoom() {
      this.disinfectionRoomLoading = false;
      this.disinfectionRoomSelectedFrom = null;
      this.disinfectionRoomSelectedTo = null;
      this.disinfectionNeedQty = 0;
      this.disinfectionTrayCode = '';
      this.disinfectionExecuting = false;
      this.writeWordWithCancel('DBW548', 0);
      this.addLog('预热房到灭菌柜选择已取消，切换为不执行状态');
    },
    // 取消灭菌柜到解析房执行
    cancelAnalysisRoom() {
      this.analysisRoomLoading = false;
      this.warehouseSelectedFrom = null;
      this.warehouseSelectedTo = null;
      this.analysisNeedQty = 0;
      this.analysisTrayCode = '';
      this.analysisExecuting = false;
      this.writeWordWithCancel('DBW550', 0);
      this.addLog('灭菌柜到解析房选择已取消，切换为不执行状态');
    },
    // 取消出库执行
    cancelOutWarehouse() {
      this.outWarehouseLoading = false;
      this.outWarehouseSelected = null;
      this.outNeedQty = 0;
      this.outWarehouseTrayCode = '';
      this.outWarehouseExecuting = false;
      this.writeWordWithCancel('DBW552', 0);
      this.addLog('出库选择已取消，切换为不执行状态');
    },
    // 由来源名称映射到端口键值
    getPortKeyByTrayFrom(trayFrom) {
      if (!trayFrom) return '';
      if (trayFrom.includes('一楼')) return '1';
      if (trayFrom.includes('二楼')) return '2';
      if (trayFrom.includes('三楼')) return '3';
      if (trayFrom.includes('四楼')) return '4';
      if (trayFrom === 'D') return 'D';
      if (trayFrom === 'E') return 'E';
      return '';
    },
    // 根据端口键值返回写入地址
    getPortAddresses(portKey) {
      const map = {
        1: {
          enableWord: 'DBW512',
          errorBit: 'DBW544_BIT0',
          allowBit: 'DBW544_BIT6'
        },
        2: {
          enableWord: 'DBW514',
          errorBit: 'DBW544_BIT1',
          allowBit: 'DBW544_BIT7'
        },
        3: {
          enableWord: 'DBW516',
          errorBit: 'DBW544_BIT2',
          allowBit: 'DBW544_BIT8'
        },
        4: {
          enableWord: 'DBW518',
          errorBit: 'DBW544_BIT3',
          allowBit: 'DBW544_BIT9'
        },
        D: {
          enableWord: 'DBW520',
          errorBit: 'DBW544_BIT4',
          allowBit: 'DBW544_BIT10'
        },
        E: {
          enableWord: 'DBW522',
          errorBit: 'DBW544_BIT5',
          allowBit: 'DBW544_BIT11'
        }
      };
      return map[portKey] || null;
    },
    // 扫码正常：允许通行 + 异常复位
    sendAllowForPort(portKey) {
      if (!portKey) return;
      const addrs = this.getPortAddresses(portKey);
      if (!addrs) return;
      ipcRenderer.send('writeValuesToPLC', addrs.enableWord, 1);
      ipcRenderer.send('writeSingleValueToPLC', addrs.allowBit, true);
      ipcRenderer.send('writeSingleValueToPLC', addrs.errorBit, false);

      // 同步更新前端勾选框状态，保持与PLC状态一致
      this.updateFrontendUploadStatus(portKey, true);

      this.addLog(`${portKey}口：允许通行，异常复位`);
    },
    // 扫码异常：置异常 + 不允许
    sendErrorForPort(portKey) {
      if (!portKey) return;
      const addrs = this.getPortAddresses(portKey);
      if (!addrs) return;
      ipcRenderer.send('writeValuesToPLC', addrs.enableWord, 0);
      ipcRenderer.send('writeSingleValueToPLC', addrs.allowBit, false);
      ipcRenderer.send('writeSingleValueToPLC', addrs.errorBit, true);

      // 同步更新前端勾选框状态，保持与PLC状态一致
      this.updateFrontendUploadStatus(portKey, false);

      this.addLog(`${portKey}口：扫码异常，禁行并置异常`);
    },
    // 更新前端上货权限状态，保持与PLC状态一致
    updateFrontendUploadStatus(portKey, allowStatus) {
      switch (portKey) {
        case '1':
          this.allowUploadOne = allowStatus;
          break;
        case '2':
          this.allowUploadTwo = allowStatus;
          break;
        case '3':
          this.allowUploadThree = allowStatus;
          break;
        case '4':
          this.allowUploadFour = allowStatus;
          break;
        case 'D':
          this.allowUploadD = allowStatus;
          break;
        case 'E':
          this.allowUploadE = allowStatus;
          break;
      }
    },
    // 光电复0：停止发送允许通行命令
    stopAllowForPort(portKey) {
      if (!portKey) return;
      const addrs = this.getPortAddresses(portKey);
      if (!addrs) return;
      ipcRenderer.send('cancelWriteToPLC', addrs.allowBit);
      ipcRenderer.send('cancelWriteToPLC', addrs.errorBit);
      this.addLog(`${portKey}口：光电复0，停止发送允许通行与异常命令`);
    },
    // 判断是否消毒，如果消毒则此托盘进入分发区队列，如果不消毒直接发走
    addToCartLoadQueue(trayCode) {
      trayCode = trayCode.trim();
      // 判断上货区队列是否有托盘信息
      if (this.queues[0].trayInfo.length > 0) {
        // 如果启用无码上货模式，直接处理第一个托盘，不检查托盘号匹配
        if (this.noCodeUpload) {
          // 取出队列中的第一个托盘信息
          const trayInfo = this.queues[0].trayInfo.shift();
          // 托盘信息进入下一队列
          this.queues[1].trayInfo.push(trayInfo);
          // 给PLC发送通行信号
          ipcRenderer.send('writeSingleValueToPLC', 'DBW544_BIT14', true);
          setTimeout(() => {
            ipcRenderer.send('cancelWriteToPLC', 'DBW544_BIT14');
          }, 2000);
          // 给PLC发送通行信号-使用备用地址-无码模式通行1
          ipcRenderer.send('writeSingleValueToPLC', 'DBW556', 1);
          setTimeout(() => {
            ipcRenderer.send('cancelWriteToPLC', 'DBW556');
          }, 2000);
          this.addLog(
            `无码上货模式 - 托盘信息：${trayInfo.trayCode} 进入分发区，给PLC发送通行信号`
          );
        } else {
          if (
            !trayCode ||
            trayCode === '' ||
            trayCode.toLowerCase().includes('read')
          ) {
            this.addLog(
              '一楼缓存区扫码失败：条码信息为NoRead,给PLC发送缓存区判断扫码失败去异常口'
            );
            // 给PLC发送缓存区判断扫码失败去异常口
            ipcRenderer.send('writeSingleValueToPLC', 'DBW544_BIT13', true);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW544_BIT13');
            }, 2000);
            // 给PLC发送通行信号-使用备用地址-异常03
            ipcRenderer.send('writeSingleValueToPLC', 'DBW556', 3);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW556');
            }, 2000);
            return;
          }
          // 正常模式下检查第一个托盘的托盘号是否与入参匹配
          if (this.queues[0].trayInfo[0].trayCode === trayCode) {
            // 给PLC发送通行信号
            ipcRenderer.send('writeSingleValueToPLC', 'DBW544_BIT14', true);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW544_BIT14');
            }, 2000);
            // 给PLC发送通行信号-使用备用地址-有码模式通行2
            ipcRenderer.send('writeSingleValueToPLC', 'DBW556', 2);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW556');
            }, 2000);
            // 取出队列中的第一个托盘信息
            const trayInfo = this.queues[0].trayInfo.shift();
            // 托盘信息进入下一队列
            this.queues[1].trayInfo.push(trayInfo);
            this.addLog(
              `托盘信息：${trayInfo.trayCode} 进入分发区，给PLC发送通行信号`
            );
          } else {
            this.addLog(
              `托盘号不匹配，读码：${trayCode}，队列第一个托盘：${this.queues[0].trayInfo[0].trayCode}，给PLC发送缓存区判断扫码失败去异常口`
            );
            // 给PLC发送缓存区判断扫码失败去异常口
            ipcRenderer.send('writeSingleValueToPLC', 'DBW544_BIT13', true);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW544_BIT13');
            }, 2000);
            // 给PLC发送通行信号-使用备用地址-异常03
            ipcRenderer.send('writeSingleValueToPLC', 'DBW556', 3);
            setTimeout(() => {
              ipcRenderer.send('cancelWriteToPLC', 'DBW556');
            }, 2000);
          }
        }
      } else {
        this.addLog(
          '一楼缓存区扫码失败：上货区队列为空，无法执行出库操作,给PLC发送缓存区判断扫码失败去异常口'
        );
        // 给PLC发送缓存区判断扫码失败去异常口
        ipcRenderer.send('writeSingleValueToPLC', 'DBW544_BIT13', true);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW544_BIT13');
        }, 2000);
        // 给PLC发送通行信号-使用备用地址-异常03
        ipcRenderer.send('writeSingleValueToPLC', 'DBW556', 3);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW556');
        }, 2000);
      }
    },
    // 添加货物到上货区队列
    addToUpLoadQueue(trayCode, trayFrom, nonSterile) {
      const portKey = this.getPortKeyByTrayFrom(trayFrom);
      trayCode = trayCode.trim();

      // 判断条码是否为无码或noread
      if (
        !trayCode ||
        trayCode === '' ||
        trayCode.toLowerCase().includes('read')
      ) {
        this.addLog(
          trayFrom + `上货区扫码失败：条码信息为NoRead或无码，发送异常信号`
        );
        // 扫码不正常：置异常并不允许进货
        this.sendErrorForPort(portKey);
        return;
      }
      // *******************从这开始往下注释**************************
      // 遍历上货区托盘号，先通过托盘号判断此托盘是不是已经在上货区上货了
      if (this.queues[0].trayInfo.length > 0) {
        for (const tray of this.queues[0].trayInfo) {
          if (tray.trayCode === trayCode) {
            this.addLog(`托盘号：${trayCode} 已在上货区上货`);
            this.$message.warning(`托盘号：${trayCode} 已在上货区上货`);
            return; // 这样就会跳出整个 addToUpLoadQueue 方法
          }
        }
      }
      // 通过trayCode 查询erp数据
      const params = {
        trayCode: trayCode.trim()
      };
      HttpUtilwms.post('/api/app/query_received_record', params)
        .then((res) => {
          // this.queues[0]： 上货区
          if (res.data && res.data.items && res.data.items.length > 0) {
            const paramInsert = {
              orderId: res.data.items[0].orderId,
              productCode: res.data.items
                .map((item) => item.materialCode)
                .join('/'),
              productName: res.data.items
                .map((item) => item.materialName)
                .join('/'),
              trayCode: trayCode,
              receiptOrderCode: res.data.receiptOrderCode,
              inPut: res.data.items[0].inPut,
              isTerile: nonSterile ? 0 : res.data.items[0].isTerile,
              detailList: JSON.stringify(res.data.items),
              orderStatus: '0',
              batchNo: res.data.items[0].batchNo,
              remark: res.data.items[0].remark,
              unit: res.data.items[0].unit,
              receivedPkgQuantity: res.data.items[0].receivedPkgQuantity
            };
            HttpUtil.post('/order/insert', paramInsert).then((resInsert) => {
              if (resInsert.data) {
                this.addLog(
                  trayFrom + `上货区队列添加货物：${trayCode}，插入成功`
                );
                const trayInfo = {
                  mainId: resInsert.data.id,
                  trayCode: trayCode,
                  trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                  orderId: paramInsert.orderId,
                  productCode: paramInsert.productCode,
                  productName: paramInsert.productName,
                  isTerile: paramInsert.isTerile,
                  receiptOrderCode: paramInsert.receiptOrderCode,
                  state: '0',
                  sendTo: '', // 发到哪个预热房，发送的时候更新
                  batchNo: paramInsert.batchNo,
                  remark: paramInsert.remark,
                  unit: paramInsert.unit,
                  receivedPkgQuantity: paramInsert.receivedPkgQuantity
                };
                this.queues[0].trayInfo.push(trayInfo);
                this.addLog(trayFrom + `上货区队列添加货物：${trayCode}`);
                // 扫码正常：允许通行并异常复位
                this.sendAllowForPort(portKey);
                this.nowScanTrayInfo = {
                  trayCode: trayInfo.trayCode,
                  orderId: trayInfo.orderId,
                  productName: trayInfo.productName,
                  isTerile: trayInfo.isTerile === 1 ? '消毒' : '不消毒',
                  inPut: trayFrom,
                  batchNo: trayInfo.batchNo,
                  remark: trayInfo.remark,
                  productCode: trayInfo.productCode
                };
              }
            });
          } else {
            // 扫码不正常：置异常并不允许进货
            this.sendErrorForPort(portKey);
            this.addLog(
              trayFrom +
                `托盘信息接口查询失败！：${trayCode}，远程托盘接口返回信息${res.data}`
            );
            this.nowScanTrayInfo = {};
          }
        })
        .catch((err) => {
          this.$message.error('查询队列失败，请重试' + err);
          // 没查询到货物信息，直接报警
          this.addLog(trayFrom + `上货区队列添加货物失败：${trayCode}`);
          // 扫码不正常：置异常并不允许进货
          this.sendErrorForPort(portKey);
          this.nowScanTrayInfo = {};
        });
      // *******************本地测试代码,本地测试时，上面注释，下面打开**********************
      // const tmpTrayCode = new Date().getTime();
      // const paramInsert = {
      //   orderId: tmpTrayCode,
      //   productCode: '234',
      //   productName: '一次性输液器',
      //   trayCode: tmpTrayCode,
      //   receiptOrderCode: tmpTrayCode,
      //   inPut: 1,
      //   isTerile: nonSterile ? 0 : 1,
      //   detailList: 'xixixi',
      //   orderStatus: '0',
      //   batchNo: '螺口22G*11/2',
      //   unit: '箱',
      //   receivedPkgQuantity: '100'
      // };
      // HttpUtil.post('/order/insert', paramInsert).then((resInsert) => {
      //   if (resInsert.data) {
      //     this.addLog(trayFrom + `上货区队列添加货物：${trayCode}，插入成功`);
      //     const trayInfo = {
      //       mainId: resInsert.data.id,
      //       trayCode: tmpTrayCode,
      //       trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
      //       orderId: paramInsert.orderId,
      //       productCode: paramInsert.productCode,
      //       productName: paramInsert.productName,
      //       isTerile: paramInsert.isTerile,
      //       receiptOrderCode: paramInsert.receiptOrderCode,
      //       state: '0',
      //       sendTo: '', // 发到哪个预热房，发送的时候更新
      //       // 预热间信息
      //       preheatingRoom: '',
      //       inPreheatingRoomTime: null,
      //       outPreheatingRoomTime: null,
      //       // 灭菌间信息
      //       sterilizationRoom: '',
      //       inSterilizationRoomTime: null,
      //       outSterilizationRoomTime: null,
      //       // 解析间信息
      //       analysisRoom: '',
      //       inAnalysisRoomTime: null,
      //       outAnalysisRoomTime: null, // 发到哪个预热房，发送的时候更新
      //       batchNo: paramInsert.batchNo,
      //       unit: paramInsert.unit,
      //       receivedPkgQuantity: paramInsert.receivedPkgQuantity
      //     };
      //     this.queues[0].trayInfo.push(trayInfo);
      //     this.addLog(trayFrom + `上货区队列添加货物：${trayCode}`);
      //     // 扫码正常：允许通行并异常复位
      //     this.sendAllowForPort(portKey);
      //     this.nowScanTrayInfo = {
      //       trayCode: trayInfo.trayCode,
      //       orderId: trayInfo.orderId,
      //       productName: trayInfo.productName,
      //       isTerile: trayInfo.isTerile === 1 ? '消毒' : '不消毒',
      //       inPut: trayFrom,
      //       batchNo: trayInfo.batchNo,
      //       productCode: trayInfo.productCode
      //     };
      //   }
      // });
    },
    // 添加扫码数据到D队列,
    addToUpLoadQueueDE(trayCode, trayFrom, nonSterile) {
      const portKey = trayFrom; // D 或 E
      trayCode = trayCode.trim();

      // 判断条码是否为无码或noread
      if (
        !trayCode ||
        trayCode === '' ||
        trayCode.toLowerCase().includes('read')
      ) {
        this.addLog(
          trayFrom + `口扫码失败：条码信息为NoRead或无码，发送异常信号`
        );
        // 扫码不正常：置异常并不允许进货
        this.sendErrorForPort(portKey);
        return;
      }

      // 遍历对应队列托盘号，先通过托盘号判断此托盘是不是已经在队列中
      const queueIndex = trayFrom === 'D' ? 12 : 13;
      if (this.queues[queueIndex].trayInfo.length > 0) {
        for (const tray of this.queues[queueIndex].trayInfo) {
          if (tray.trayCode === trayCode) {
            this.addLog(`托盘号：${trayCode} 已在${trayFrom}队列中`);
            this.$message.warning(`托盘号：${trayCode} 已在${trayFrom}队列中`);
            return;
          }
        }
      }

      // 通过trayCode 查询erp数据
      const params = {
        trayCode: trayCode.trim()
      };
      HttpUtilwms.post('/api/app/query_received_record', params)
        .then((res) => {
          if (res.data && res.data.items && res.data.items.length > 0) {
            const paramInsert = {
              orderId: res.data.items[0].orderId,
              productCode: res.data.items
                .map((item) => item.materialCode)
                .join('/'),
              productName: res.data.items
                .map((item) => item.materialName)
                .join('/'),
              trayCode: trayCode,
              receiptOrderCode: res.data.receiptOrderCode,
              inPut: res.data.items[0].inPut,
              isTerile: nonSterile ? 0 : res.data.items[0].isTerile,
              detailList: JSON.stringify(res.data.items),
              orderStatus: '0',
              batchNo: res.data.items[0].batchNo,
              remark: res.data.items[0].remark,
              unit: res.data.items[0].unit,
              receivedPkgQuantity: res.data.items[0].receivedPkgQuantity
            };
            HttpUtil.post('/order/insert', paramInsert).then((resInsert) => {
              if (resInsert.data) {
                this.addLog(`${trayFrom}队列添加货物：${trayCode}，插入成功`);
                const trayInfo = {
                  mainId: resInsert.data.id,
                  trayCode: trayCode,
                  trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                  orderId: paramInsert.orderId,
                  productCode: paramInsert.productCode,
                  productName: paramInsert.productName,
                  isTerile: paramInsert.isTerile,
                  receiptOrderCode: paramInsert.receiptOrderCode,
                  state: '0',
                  sendTo: '', // 发到哪个预热房，发送的时候更新
                  batchNo: paramInsert.batchNo,
                  remark: paramInsert.remark,
                  unit: paramInsert.unit,
                  receivedPkgQuantity: paramInsert.receivedPkgQuantity,
                  // 预热间信息
                  preheatingRoom: '',
                  inPreheatingRoomTime: null,
                  outPreheatingRoomTime: null,
                  // 灭菌间信息
                  sterilizationRoom: '',
                  inSterilizationRoomTime: null,
                  outSterilizationRoomTime: null,
                  // 解析间信息
                  analysisRoom: '',
                  inAnalysisRoomTime: null,
                  outAnalysisRoomTime: null
                };
                this.queues[queueIndex].trayInfo.push(trayInfo);
                this.addLog(`${trayFrom}队列添加货物：${trayCode}`);
                // 扫码正常：允许通行并异常复位
                this.sendAllowForPort(portKey);
                this.nowScanTrayInfo = {
                  trayCode: trayInfo.trayCode,
                  orderId: trayInfo.orderId,
                  productName: trayInfo.productName,
                  isTerile: trayInfo.isTerile === 1 ? '消毒' : '不消毒',
                  inPut: trayFrom,
                  batchNo: trayInfo.batchNo,
                  remark: trayInfo.remark,
                  productCode: trayInfo.productCode
                };
              }
            });
          } else {
            // 扫码不正常：置异常并不允许进货
            this.sendErrorForPort(portKey);
            this.addLog(
              trayFrom +
                `托盘信息接口查询失败！：${trayCode}，远程托盘接口返回信息${res.data}`
            );
            this.nowScanTrayInfo = {};
          }
        })
        .catch((err) => {
          this.$message.error('查询队列失败，请重试' + err);
          // 没查询到货物信息，直接报警
          this.addLog(`${trayFrom}队列添加货物失败：${trayCode}`);
          // 扫码不正常：置异常并不允许进货
          this.sendErrorForPort(portKey);
          this.nowScanTrayInfo = {};
        });
    },
    // 无码上货直接添加托盘信息
    addNoCodeTrayToUpLoadQueue(trayFrom, nonSterile) {
      const trayInfo = {
        trayCode: 'no-tray-code',
        trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        orderId: 'NO-ORDER',
        productCode: 'NO-PRODUCT',
        productName: '无码产品',
        isTerile: nonSterile ? 0 : 1,
        state: '0',
        sendTo: '',
        // 预热间信息
        preheatingRoom: '',
        inPreheatingRoomTime: null,
        outPreheatingRoomTime: null,
        // 灭菌间信息
        sterilizationRoom: '',
        inSterilizationRoomTime: null,
        outSterilizationRoomTime: null,
        // 解析间信息
        analysisRoom: '',
        inAnalysisRoomTime: null,
        outAnalysisRoomTime: null
      };
      this.queues[0].trayInfo.push(trayInfo);
      this.addLog(trayFrom + `无码上货区队列添加货物：no-tray-code`);
      this.nowScanTrayInfo = {
        trayCode: trayInfo.trayCode,
        orderId: trayInfo.orderId,
        productName: trayInfo.productName,
        isTerile: trayInfo.isTerile === 1 ? '消毒' : '不消毒',
        inPut: trayFrom
      };
    },
    // DE无码上货直接添加托盘信息到对应队列
    addNoCodeTrayToUpLoadQueueDE(trayFrom, nonSterile) {
      const trayInfo = {
        trayCode: 'no-tray-code',
        trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        orderId: 'NO-ORDER',
        productCode: 'NO-PRODUCT',
        productName: '无码产品',
        state: '0',
        isTerile: nonSterile ? 0 : 1,
        // 预热间信息
        preheatingRoom: '',
        inPreheatingRoomTime: null,
        outPreheatingRoomTime: null,
        // 灭菌间信息
        sterilizationRoom: '',
        inSterilizationRoomTime: null,
        outSterilizationRoomTime: null,
        // 解析间信息
        analysisRoom: '',
        inAnalysisRoomTime: null,
        outAnalysisRoomTime: null
      };
      const queueIndex = trayFrom === 'D' ? 12 : 13;
      this.queues[queueIndex].trayInfo.push(trayInfo);
      this.addLog(trayFrom + `${trayFrom}队列无码上货添加货物：no-tray-code`);
      this.nowScanTrayInfo = {
        trayCode: trayInfo.trayCode,
        orderId: trayInfo.orderId,
        productName: trayInfo.productName,
        isTerile: trayInfo.isTerile === 1 ? '消毒' : '不消毒',
        inPut: trayFrom
      };
    },
    // 处理非灭菌复选框权限控制
    handleNonSterileChange(checkboxName, locationName) {
      // 阻止默认的change事件，先进行权限验证
      this.$nextTick(() => {
        // 恢复原来的状态
        this[checkboxName] = !this[checkboxName];
      });

      // 记录当前要修改的复选框信息
      this.currentNonSterileCheckbox = {
        name: checkboxName,
        location: locationName
      };

      // 显示密码输入对话框
      this.adminPasswordDialogVisible = true;
      this.adminPasswordForm.password = '';

      // 聚焦到密码输入框
      this.$nextTick(() => {
        this.$refs.adminPasswordForm.$el
          .querySelector('input[type="password"]')
          .focus();
      });
    },

    // 验证管理员密码
    verifyAdminPassword() {
      this.$refs.adminPasswordForm.validate((valid) => {
        if (valid) {
          this.adminPasswordLoading = true;

          // 使用登录接口验证管理员账号密码
          const param = {
            userCode: 'admin',
            userPassword: this.adminPasswordForm.password
          };

          // 调用登录接口进行验证
          HttpUtil.post('/login/login', param)
            .then((res) => {
              if (res.data) {
                // 登录成功，允许修改
                if (this.currentNonSterileCheckbox) {
                  const { name, location } = this.currentNonSterileCheckbox;
                  this[name] = !this[name];

                  this.addLog(
                    `管理员权限验证通过，${location}非灭菌状态已修改为：${
                      this[name] ? '非灭菌' : '灭菌'
                    }`
                  );
                  this.$message.success(`${location}非灭菌状态修改成功`);
                }

                // 处理无码模式切换
                if (this.currentOperation === 'toggleNoCodeUpload') {
                  this.noCodeUpload = !this.noCodeUpload;
                  if (this.noCodeUpload) {
                    this.$message.success(
                      '已启用无码上货模式，触发光电信号将直接添加托盘'
                    );
                    this.addLog('无码上货模式已启用，已给PLC，DBW562发送2');
                    // 无码模式发2
                    ipcRenderer.send('writeValuesToPLC', 'DBW562', 2);
                  } else {
                    this.$message.info(
                      '已关闭无码上货模式，已给PLC，DBW562发送1'
                    );
                    this.addLog('无码上货模式已关闭');
                    // 有码模式发1
                    ipcRenderer.send('writeValuesToPLC', 'DBW562', 1);
                  }
                }

                // 关闭对话框
                this.adminPasswordDialogVisible = false;
                this.currentNonSterileCheckbox = null;
                this.currentOperation = null;
              } else {
                // 登录失败
                if (this.currentOperation === 'toggleNoCodeUpload') {
                  this.$message.error(
                    '管理员账号或密码错误，无法切换无码上货模式'
                  );
                  this.addLog('管理员权限验证失败，无码上货模式切换被拒绝');
                } else {
                  this.$message.error(
                    '管理员账号或密码错误，无法修改非灭菌状态'
                  );
                  this.addLog(
                    `管理员权限验证失败，${this.currentNonSterileCheckbox?.location}非灭菌状态修改被拒绝`
                  );
                }
              }
            })
            .catch((err) => {
              // 接口调用失败
              this.$message.error('验证失败，请检查网络连接');
              if (this.currentOperation === 'toggleNoCodeUpload') {
                this.addLog(
                  '管理员权限验证接口调用失败，无码上货模式切换被拒绝'
                );
              } else {
                this.addLog(
                  `管理员权限验证接口调用失败，${this.currentNonSterileCheckbox?.location}非灭菌状态修改被拒绝`
                );
              }
            })
            .finally(() => {
              this.adminPasswordLoading = false;
            });
        }
      });
    },

    // 取消管理员密码验证
    cancelAdminPassword() {
      this.adminPasswordDialogVisible = false;
      this.currentNonSterileCheckbox = null;
      this.currentOperation = null;
      this.adminPasswordForm.password = '';
      if (this.currentOperation === 'toggleNoCodeUpload') {
        this.$message.info('已取消无码上货模式切换');
      } else {
        this.$message.info('已取消非灭菌状态修改');
      }
    },
    // 调用WMS出货接口
    callWmsUnloadGoods(trayCode, state, queueType = '') {
      const params = {
        trayCode: trayCode,
        state: state
      };

      let statusText = '';
      if (queueType === 'D') {
        statusText = 'D出货';
      } else if (queueType === 'E') {
        statusText = 'E出货';
      } else {
        statusText = '非灭菌出货';
      }

      this.addLog(`调用WMS出货接口，托盘号：${trayCode}，状态：${statusText}`);

      HttpUtilwms.post('/api/app/unload_goods', params)
        .then((res) => {
          if (res.code === 200) {
            this.addLog(
              `WMS出货接口调用成功，托盘号：${trayCode}，状态：${statusText}`
            );
          } else {
            this.addLog(
              `WMS出货接口调用失败，托盘号：${trayCode}，状态：${statusText}，错误信息：${
                res.msg || '未知错误'
              }`
            );
          }
        })
        .catch((err) => {
          this.addLog(
            `WMS出货接口调用异常，托盘号：${trayCode}，状态：${statusText}，错误：${err.message}`
          );
          console.error('WMS出货接口调用异常:', err);
        });
    },
    // 切换无码上货状态
    toggleNoCodeUpload() {
      // 检查是否要从无码模式切换到有码模式
      if (this.noCodeUpload) {
        // 检查上货区队列是否还有托盘
        if (this.queues[0].trayInfo.length > 0) {
          this.$message.warning('上货区队列有货，禁止切换，请先进行处理！');
          this.addLog('无码模式切换到有码模式被拒绝：上货区队列还有托盘');
          return;
        }
      }

      // 显示管理员密码验证对话框
      this.currentOperation = 'toggleNoCodeUpload';
      this.adminPasswordDialogVisible = true;
      this.adminPasswordForm.password = '';

      // 聚焦到密码输入框
      this.$nextTick(() => {
        this.$refs.adminPasswordForm.$el
          .querySelector('input[type="password"]')
          .focus();
      });
    },
    changeQueueExpanded() {
      this.isQueueExpanded = !this.isQueueExpanded;
      // 当展开面板时，刷新当前选中队列的托盘信息
      if (this.isQueueExpanded && this.selectedQueueIndex !== -1) {
        this.showTrays(this.selectedQueueIndex);
      }
    },
    // 显示订单查询对话框
    showOrderQueryDialog() {
      this.orderQueryDialogVisible = true;
    },
    toggleButtonState(button) {
      if (button === 'start') {
        this.$confirm('确定要全线启动吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            ipcRenderer.send('writeValuesToPLC', 'DBW502', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'DBW502', 0);
            }, 2000);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线启动成功');
            this.addLog('全线启动成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'stop') {
        this.$confirm('确定要全线停止吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            ipcRenderer.send('writeValuesToPLC', 'DBW504', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'DBW504', 0);
            }, 2000);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线停止成功');
            this.addLog('全线停止成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'reset') {
        this.$confirm('确定要全线暂停吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates = {
              start: false,
              stop: false,
              reset: false,
              fault_reset: false,
              clear: false
            };
            this.buttonStates[button] = !this.buttonStates[button];
            ipcRenderer.send('writeValuesToPLC', 'DBW506', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'DBW506', 0);
            }, 2000);
            this.$message.success('全线暂停成功');
            this.addLog('全线暂停成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'fault_reset') {
        this.$confirm('确定要故障复位吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            ipcRenderer.send('writeValuesToPLC', 'DBW508', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'DBW508', 0);
            }, 2000);
            this.$message.success('故障复位成功');
            this.addLog('故障复位成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'clear') {
        this.$confirm('确定要全线清空吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            // 把所有的队列，初试状态都清空
            this.queues.forEach((queue) => {
              queue.trayInfo = [];
            });
            this.nowScanTrayInfo = {};
            this.runningLogs = []; // 修改为空数组
            this.alarmLogs = []; // 修改为空数组
            this.nowTrays = [];
            // 添加复选框状态-一楼允许上货
            // this.allowUploadOne = false;
            // // 添加复选框状态-一楼是否非灭菌（默认灭菌）
            // this.nonSterileOne = false;
            // // 添加复选框状态-二楼允许上货
            // this.allowUploadTwo = false;
            // // 添加复选框状态-二楼是否非灭菌（默认灭菌）
            // this.nonSterileTwo = false;
            // // 添加复选框状态-三楼允许上货
            // this.allowUploadThree = false;
            // // 添加复选框状态-三楼是否非灭菌（默认灭菌）
            // this.nonSterileThree = false;
            // // 添加复选框状态-四楼允许上货
            // this.allowUploadFour = false;
            // // 添加复选框状态-四楼是否非灭菌（默认灭菌）
            // this.nonSterileFour = false;
            // // 添加复选框状态-D灭菌柜允许上货
            // this.allowUploadD = false;
            // // 添加复选框状态-D灭菌柜是否非灭菌（默认灭菌）
            // this.nonSterileD = false;
            // // 添加复选框状态-E灭菌柜允许上货
            // this.allowUploadE = false;
            // // 添加复选框状态-E灭菌柜是否非灭菌（默认灭菌）
            // this.nonSterileE = false;
            // 显示小车1设置去哪个预热房的按钮
            this.showCar1SetPreheatingRoom = false;
            // 显示小车设置去哪个预热房的按钮
            this.preheatingRoomSelected = '';
            // 灭菌出发地
            this.disinfectionRoomSelectedFrom = '';
            // 灭菌目的地
            this.disinfectionRoomSelectedTo = '';
            // 立库出发地
            this.warehouseSelectedFrom = '';
            // 立库目的地
            this.warehouseSelectedTo = '';
            // 出库选择
            this.outWarehouseSelected = '';
            // 当前出库托盘数据
            this.currentOutTrayInfo = {
              trayCode: '',
              productName: '',
              isTerile: ''
            };
            this.$message.success('全线清空成功');
            this.addLog('全线清空成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      }
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    initializeMarkers() {
      this.$nextTick(() => {
        this.updateMarkerPositions();
        window.addEventListener('resize', this.updateMarkerPositions);
      });
    },
    updateMarkerPositions() {
      const images = document.querySelectorAll('.floor-image');
      images.forEach((image) => {
        const imageWrapper = image.parentElement;
        if (!imageWrapper) return;

        const markers = imageWrapper.querySelectorAll(
          '.marker, .marker-with-panel, .marker-with-button, .queue-marker, .motor-marker, .preheating-room-marker, .analysis-status-marker'
        );
        const carts = imageWrapper.querySelectorAll('.cart-container');
        const wrapperRect = imageWrapper.getBoundingClientRect();

        // 计算图片的实际显示区域
        const displayedWidth = image.width;
        const displayedHeight = image.height;
        const scaleX = displayedWidth / image.naturalWidth;
        const scaleY = displayedHeight / image.naturalHeight;

        // 计算图片在容器中的偏移量
        const imageOffsetX = (wrapperRect.width - displayedWidth) / 2;
        const imageOffsetY = (wrapperRect.height - displayedHeight) / 2;

        markers.forEach((marker) => {
          const x = parseFloat(marker.dataset.x);
          const y = parseFloat(marker.dataset.y);
          if (!isNaN(x) && !isNaN(y)) {
            marker.style.left = `${imageOffsetX + x * scaleX}px`;
            marker.style.top = `${imageOffsetY + y * scaleY}px`;
          }
        });

        // 更新小车位置和大小
        carts.forEach((cart) => {
          const x = parseFloat(cart.dataset.x);
          const y = parseFloat(cart.dataset.y);
          const width = parseFloat(cart.dataset.width);
          if (!isNaN(x) && !isNaN(y)) {
            cart.style.left = `${imageOffsetX + x * scaleX}px`;
            cart.style.top = `${imageOffsetY + y * scaleY}px`;
            if (!isNaN(width)) {
              cart.style.width = `${width * scaleX}px`;
            }
          }
        });
      });
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.updateMarkerPositions);
    },
    // 根据PLC数值更新小车位置
    updateCartPositionByValue(cartId, value) {
      const cart = this.carts.find((c) => c.id === cartId);
      if (!cart) return;

      // 获取对应小车的y轴范围
      const yRange = this.cartYRanges[`cart${cartId}`];
      if (!yRange) return;

      // 获取PLC数值范围
      const plcRanges = {
        cart1: { min: 0, max: 1450 },
        cart2: { min: 0, max: 1010 },
        cart3: { min: 0, max: 1010 },
        cart4: { min: 979, max: 2873 }
      };

      const plcRange = plcRanges[`cart${cartId}`];
      if (!plcRange) return;

      // 计算比例（基于新的范围起点）
      let ratio;
      if (cartId === 4) {
        // 小车4特殊处理：979为起点，2873为终点
        ratio = (value - plcRange.min) / (plcRange.max - plcRange.min);
        ratio = Math.max(0, Math.min(1, ratio)); // 确保比例在0-1范围内
      } else {
        ratio = value / plcRange.max;
      }

      // 根据比例计算y轴位置（PLC原点对应y轴最小值，PLC终点对应y轴最大值）
      const yPosition = yRange.min + (yRange.max - yRange.min) * ratio;

      // 更新小车位置
      cart.y = Math.round(yPosition);

      // 更新视图
      this.$nextTick(() => {
        this.updateMarkerPositions();
      });
    },
    showTrays(index) {
      if (index < 0 || index >= this.queues.length) {
        this.nowTrays = [];
        return;
      }

      this.selectedQueueIndex = index;
      const selectedQueue = this.queues[index];

      if (!selectedQueue) {
        this.nowTrays = [];
        return;
      }

      try {
        // 确保 trayInfo 是数组
        const trayInfo = Array.isArray(selectedQueue.trayInfo)
          ? selectedQueue.trayInfo
          : [];

        this.nowTrays = trayInfo
          .map((tray) => ({
            id: tray.trayCode || '',
            name: tray.trayCode ? `托盘 ${tray.trayCode}` : '未知托盘',
            time: tray.trayTime || '',
            isTerile: tray.isTerile,
            sendTo: tray.sendTo || '', // 添加sendTo属性
            state: tray.state || '', // 添加state属性
            sequenceNumber: tray.sequenceNumber || '', // 添加sequenceNumber属性
            orderId: tray.orderId || '', // 添加订单ID
            productCode: tray.productCode || '', // 添加物料编码
            productName: tray.productName || '', // 添加产品名称
            unit: tray.unit || '', // 添加规格
            batchNo: tray.batchNo || '', // 添加批次
            remark: tray.remark || '' // 添加备注
          }))
          .filter((tray) => tray.id); // 过滤掉没有 id 的托盘
      } catch (error) {
        console.error('处理托盘信息时出错:', error);
        this.nowTrays = [];
      }
    },
    handleDragStart(event, tray, queueIndex) {
      if (!tray || queueIndex === undefined) return;

      this.isDragging = true;
      this.draggedTray = tray;
      this.dragSourceQueue = queueIndex;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tray.id);

      setTimeout(() => {
        event.target.classList.add('dragging');
      }, 0);
    },
    handleDragEnd(event) {
      this.isDragging = false;
      event.target.classList.remove('dragging');
    },
    async handleDrop(targetQueueIndex) {
      if (
        !this.draggedTray ||
        this.dragSourceQueue === null ||
        targetQueueIndex === null
      )
        return;
      if (this.dragSourceQueue === targetQueueIndex) return;

      const sourceQueue = this.queues[this.dragSourceQueue];
      const targetQueue = this.queues[targetQueueIndex];

      if (!sourceQueue || !targetQueue) {
        this.$message.error('队列不存在，无法移动托盘');
        return;
      }

      sourceQueue.trayInfo = Array.isArray(sourceQueue.trayInfo)
        ? sourceQueue.trayInfo
        : [];
      targetQueue.trayInfo = Array.isArray(targetQueue.trayInfo)
        ? targetQueue.trayInfo
        : [];

      try {
        // 确认移动操作
        await this.$confirm(
          `确认将托盘 ${this.draggedTray.id} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}？`,
          '移动托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        if (!this.draggedTray.id) {
          throw new Error('托盘信息无效');
        }

        const trayIndex = sourceQueue.trayInfo.findIndex(
          (t) => t.trayCode === this.draggedTray.id
        );
        if (trayIndex === -1) {
          throw new Error('找不到要移动的托盘');
        }

        const [movedTray] = sourceQueue.trayInfo.splice(trayIndex, 1);
        targetQueue.trayInfo.push(movedTray);

        // 更新队列数据
        this.updateQueueTrays(sourceQueue.id, sourceQueue.trayInfo);
        this.updateQueueTrays(targetQueue.id, targetQueue.trayInfo);

        const currentQueueIndex = this.selectedQueueIndex;
        if (
          currentQueueIndex === targetQueueIndex ||
          currentQueueIndex === this.dragSourceQueue
        ) {
          this.$nextTick(() => {
            this.showTrays(currentQueueIndex);
          });
        }

        // 添加托盘移动日志
        this.addLog(
          `托盘 ${movedTray.trayCode} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}`
        );

        this.$message({
          type: 'success',
          message: `托盘 ${movedTray.trayCode} 已成功移动到 ${targetQueue.queueName}`,
          duration: 2000
        });
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        console.error('移动托盘时出错:', error);
        this.$message.error(error.message || '移动托盘失败，请重试');
      } finally {
        this.draggedTray = null;
        this.dragSourceQueue = null;
        this.isDragging = false;
      }
    },
    clearAllQrCodes() {
      this.elevatorOneFloorScanCode = '';
      this.elevatorTwoFloorScanCode = '';
      this.elevatorThreeFloorScanCode = '';
      this.elevatorFourFloorScanCode = '';
      this.oneFloorElevatorScanCode = '';
    },
    // 添加更新队列托盘的方法
    updateQueueTrays(queueId, trayInfo) {
      // 查找对应ID的队列
      const queueIndex = this.queues.findIndex((queue) => queue.id === queueId);
      if (queueIndex !== -1) {
        // 直接更新前端队列数据
        this.queues[queueIndex].trayInfo = trayInfo;
        // 添加日志
        this.addLog(`队列 ${this.queues[queueIndex].queueName} 数据已更新`);
      } else {
        this.$message.error('找不到队列ID: ' + queueId);
      }
    },
    async deleteTray(tray, index) {
      if (!this.selectedQueue) return;

      try {
        // 确认是否删除
        await this.$confirm(
          '确认要删除该托盘吗？删除后请注意是否需要同步修改PLC队列数据！',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 从队列中移除托盘，直接使用传递的index
        if (index >= 0 && index < this.selectedQueue.trayInfo.length) {
          this.selectedQueue.trayInfo.splice(index, 1);

          // 更新队列数据
          this.updateQueueTrays(
            this.selectedQueue.id,
            this.selectedQueue.trayInfo
          );

          // 刷新显示
          this.showTrays(this.selectedQueueIndex);

          // 添加删除托盘日志
          this.addLog(
            `托盘 ${tray.id} 已从 ${this.selectedQueue.queueName} 删除`
          );

          this.$message.success('托盘删除成功');
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除托盘失败，请重试');
        }
      }
    },
    // 上移托盘
    async moveTrayUp(index) {
      if (!this.selectedQueue || index <= 0) return;

      try {
        // 获取当前队列的托盘信息
        const trayInfo = Array.isArray(this.selectedQueue.trayInfo)
          ? this.selectedQueue.trayInfo
          : [];

        const currentTray = trayInfo[index];
        const prevTray = trayInfo[index - 1];

        // 确认上移操作
        await this.$confirm(
          `确认将托盘 ${currentTray.trayCode} 上移一位（与 ${prevTray.trayCode} 交换位置）？`,
          '上移托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 交换位置
        trayInfo[index] = prevTray;
        trayInfo[index - 1] = currentTray;

        // 更新队列数据
        this.updateQueueTrays(this.selectedQueue.id, trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加操作日志
        this.addLog(
          `托盘 ${currentTray.trayCode} 在 ${this.selectedQueue.queueName} 中上移`
        );

        this.$message.success('托盘上移成功');
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        this.$message.error('托盘上移失败，请重试');
      }
    },
    // 下移托盘
    async moveTrayDown(index) {
      if (!this.selectedQueue || index >= this.nowTrays.length - 1) return;

      try {
        // 获取当前队列的托盘信息
        const trayInfo = Array.isArray(this.selectedQueue.trayInfo)
          ? this.selectedQueue.trayInfo
          : [];

        const currentTray = trayInfo[index];
        const nextTray = trayInfo[index + 1];

        // 确认下移操作
        await this.$confirm(
          `确认将托盘 ${currentTray.trayCode} 下移一位（与 ${nextTray.trayCode} 交换位置）？`,
          '下移托盘确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        // 交换位置
        trayInfo[index] = nextTray;
        trayInfo[index + 1] = currentTray;

        // 更新队列数据
        this.updateQueueTrays(this.selectedQueue.id, trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加操作日志
        this.addLog(
          `托盘 ${currentTray.trayCode} 在 ${this.selectedQueue.queueName} 中下移`
        );

        this.$message.success('托盘下移成功');
      } catch (error) {
        if (error === 'cancel') {
          // 用户取消操作
          return;
        }
        this.$message.error('托盘下移失败，请重试');
      }
    },
    showAddTrayDialog() {
      this.addTrayDialogVisible = true;
      this.newTrayForm = {
        trayCode: '',
        batchId: '',
        isSterile: true
      };
    },
    // 显示托盘检索弹窗
    showTraySearchDialog() {
      this.traySearchDialogVisible = true;
      this.traySearchForm.trayCode = '';
      this.traySearchForm.orderId = '';
      this.traySearchForm.productCode = '';
      this.traySearchForm.productName = '';
      this.searchResults = [];
      this.hasSearched = false;
    },
    // 托盘检索方法
    async searchTray() {
      // 检查至少有一个查询条件
      const hasSearchCondition =
        this.traySearchForm.trayCode.trim() ||
        this.traySearchForm.orderId.trim() ||
        this.traySearchForm.productCode.trim() ||
        this.traySearchForm.productName.trim();

      if (!hasSearchCondition) {
        this.$message.warning('请至少输入一个查询条件');
        return;
      }

      this.searchLoading = true;
      this.hasSearched = true;
      this.searchResults = [];

      try {
        const searchCriteria = {
          trayCode: this.traySearchForm.trayCode.trim(),
          orderId: this.traySearchForm.orderId.trim(),
          productCode: this.traySearchForm.productCode.trim(),
          productName: this.traySearchForm.productName.trim()
        };

        // 在所有队列中查找符合条件的托盘
        const foundTrays = [];

        for (const queue of this.queues) {
          if (queue.trayInfo && Array.isArray(queue.trayInfo)) {
            for (const tray of queue.trayInfo) {
              // 检查是否符合所有输入的查询条件
              let matches = true;

              if (
                searchCriteria.trayCode &&
                String(tray.trayCode || '').trim() !==
                  String(searchCriteria.trayCode).trim()
              ) {
                matches = false;
              }
              if (
                searchCriteria.orderId &&
                (!tray.orderId ||
                  !String(tray.orderId).includes(searchCriteria.orderId))
              ) {
                matches = false;
              }
              if (
                searchCriteria.productCode &&
                (!tray.productCode ||
                  !String(tray.productCode).includes(
                    searchCriteria.productCode
                  ))
              ) {
                matches = false;
              }
              if (
                searchCriteria.productName &&
                (!tray.productName ||
                  !String(tray.productName).includes(
                    searchCriteria.productName
                  ))
              ) {
                matches = false;
              }

              if (matches) {
                foundTrays.push({
                  ...tray,
                  queueName: queue.queueName
                });
              }
            }
          }
        }

        if (foundTrays.length > 0) {
          this.searchResults = foundTrays;
          this.addLog(
            `托盘检索成功：找到 ${foundTrays.length} 个符合条件的托盘`
          );
        } else {
          this.searchResults = [];
          this.addLog('托盘检索：未找到符合条件的托盘');
        }
      } catch (error) {
        console.error('托盘检索失败:', error);
        this.$message.error('托盘检索失败，请重试');
        this.addLog(`托盘检索失败：${error.message}`);
      } finally {
        this.searchLoading = false;
      }
    },
    async submitAddTray() {
      if (!this.selectedQueue) return;

      try {
        // 表单验证
        await this.$refs.newTrayForm.validate();

        this.isSubmitting = true;
        const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const newTray = {
          trayCode: this.newTrayForm.trayCode,
          trayTime: currentTime,
          batchId: this.newTrayForm.batchId,
          isTerile: this.newTrayForm.isSterile ? 1 : 0,
          state: '0',
          sendTo: '',
          sequenceNumber: null
        };

        // 确保trayInfo是数组
        if (!Array.isArray(this.selectedQueue.trayInfo)) {
          this.selectedQueue.trayInfo = [];
        }

        // 添加新托盘
        this.selectedQueue.trayInfo.push(newTray);

        // 更新队列数据
        this.updateQueueTrays(
          this.selectedQueue.id,
          this.selectedQueue.trayInfo
        );

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加新托盘日志
        this.addLog(
          `新托盘 ${newTray.trayCode} 已添加到 ${
            this.selectedQueue.queueName
          }，批次号：${newTray.batchId}，${
            newTray.isTerile === 1 ? '灭菌' : '不灭菌'
          }`
        );

        this.$message.success('托盘添加成功');
        this.addTrayDialogVisible = false;
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('添加托盘失败，请重试');
        }
      } finally {
        this.isSubmitting = false;
      }
    },
    // 点击队列标识
    handleQueueMarkerClick(queueId) {
      // 展开队列面板
      this.isQueueExpanded = true;

      // 找到队列在数组中的索引
      const queueIndex = this.queues.findIndex((q) => q.id === queueId);
      if (queueIndex !== -1) {
        // 选中并显示对应队列
        this.selectedQueueIndex = queueIndex;
        this.showTrays(queueIndex);
      }
    },
    // 添加新的日志方法
    addLog(message, type = 'running') {
      const log = {
        id: this.logId++,
        type,
        message,
        timestamp: new Date().getTime(),
        unread: type === 'alarm'
      };

      if (type === 'running') {
        this.runningLogs.unshift(log);
        // 保持日志数量在合理范围内
        if (this.runningLogs.length > 100) {
          this.runningLogs.pop();
        }
      } else {
        this.alarmLogs.unshift(log);
        if (this.alarmLogs.length > 100) {
          this.alarmLogs.pop();
        }
      }
      // 同时写入本地文件
      const logTypeText = type === 'running' ? '运行日志' : '报警日志';
      const logMessage = `[${logTypeText}] ${message}`;
      ipcRenderer.send('writeLogToLocal', logMessage);
    },
    toggleBitValue(obj, bit) {
      obj[bit] = obj[bit] === '1' ? '0' : '1';
    },
    // 写入后2秒取消
    writeWordWithCancel(addr, value) {
      ipcRenderer.send('writeSingleValueToPLC', addr, Number(value) || 0);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', addr);
      }, 2000);
    },
    // 区域数量获取
    getPreheatCountFor(room) {
      if (room === 'A') return Number(this.aLineQuantity.a1) || 0;
      if (room === 'B') return Number(this.bLineQuantity.b1) || 0;
      if (room === 'C') return Number(this.cLineQuantity.c1) || 0;
      return 0;
    },
    getSterilizeCountFor(room) {
      if (room === 'A') return Number(this.aLineQuantity.a2) || 0;
      if (room === 'B') return Number(this.bLineQuantity.b2) || 0;
      if (room === 'C') return Number(this.cLineQuantity.c2) || 0;
      return 0;
    },
    getAnalysisCountFor(room) {
      if (room === 'A') return Number(this.aLineQuantity.a3) || 0;
      if (room === 'B') return Number(this.bLineQuantity.b3) || 0;
      if (room === 'C') return Number(this.cLineQuantity.c3) || 0;
      return 0;
    },
    // 检查目的地是否已满16个托盘，满了则自动设置为不执行
    checkDestinationLimit() {
      // 检查预热房（A1, B1, C1）是否满16个
      if (this.preheatingRoomSelected) {
        const preheatCount = this.getPreheatCountFor(
          this.preheatingRoomSelected
        );
        if (preheatCount >= 16) {
          const oldSelection = this.preheatingRoomSelected;
          this.preheatingRoomSelected = null;
          this.preheatingRoomLoading = false; // 恢复loading状态
          this.addLog(`预热房${oldSelection}已满16个托盘，自动切换为不执行`);
        }
      }

      // 检查灭菌房目的地（A2, B2, C2）是否满16个
      if (this.disinfectionRoomSelectedTo) {
        const sterilizeCount = this.getSterilizeCountFor(
          this.disinfectionRoomSelectedTo
        );
        if (sterilizeCount >= 16) {
          const oldSelection = this.disinfectionRoomSelectedTo;
          this.disinfectionRoomSelectedTo = null;
          this.disinfectionRoomLoading = false; // 恢复loading状态
          this.addLog(
            `灭菌房目的地${oldSelection}已满16个托盘，自动切换为不执行`
          );
        }
      }

      // 检查解析库目的地（A3, B3, C3）是否满16个
      if (this.warehouseSelectedTo) {
        const analysisCount = this.getAnalysisCountFor(
          this.warehouseSelectedTo
        );
        if (analysisCount >= 16) {
          const oldSelection = this.warehouseSelectedTo;
          this.warehouseSelectedTo = null;
          this.analysisRoomLoading = false; // 恢复loading状态
          this.addLog(
            `解析库目的地${oldSelection}已满16个托盘，自动切换为不执行`
          );
        }
      }
    },

    // DBW546 预热柜需进货
    updatePreheatNeedAndWrite() {
      if (!this.preheatingRoomSelected) {
        this.preheatNeedQty = 0;
        this.addLog(`写入PLC DBW546（预热房需进货数量）: 0 - 未选择预热房`);
        this.writeWordWithCancel('DBW546', 0);
        return;
      }
      const arrived = this.getPreheatCountFor(this.preheatingRoomSelected);
      // 如果正在执行且有设置执行数量，计算需进货数量；否则为0
      let need = 0;
      if (this.preheatExecuting && this.preheatExecQty > 0) {
        need = Math.max(0, Number(this.preheatExecQty) - arrived);
      }
      // 设置显示的需进货数量和写入PLC的值
      if (!this.preheatExecuting) {
        // 未执行时，显示和PLC都写入0
        this.preheatNeedQty = 0;
        need = 0;
      } else {
        this.preheatNeedQty = need;
      }

      // 当正在执行且需进货数量为0时，自动切换为不执行
      if (
        this.preheatNeedQty === 0 &&
        this.preheatingRoomSelected &&
        this.preheatExecuting
      ) {
        const oldSelection = this.preheatingRoomSelected;
        this.preheatingRoomSelected = null;
        this.preheatingRoomLoading = false; // 恢复loading状态
        this.preWarmTrayCode = '';
        this.$message.warning(
          `预热房${oldSelection}执行中需进货数量为0，已自动切换为不执行`
        );
        this.addLog(
          `预热房${oldSelection}执行中需进货数量为0，已自动切换为不执行`
        );
      }

      this.addLog(`写入PLC DBW546（预热房需进货数量）: ${need}`);
      this.writeWordWithCancel('DBW546', need);
    },
    // DBW548 灭菌柜需进货
    updateDisinfectionNeedAndWrite() {
      if (!this.disinfectionRoomSelectedFrom) {
        this.disinfectionNeedQty = 0;
        this.addLog(`写入PLC DBW548（灭菌柜需进货数量）: 0 - 未选择灭菌柜`);
        this.writeWordWithCancel('DBW548', 0);
        return;
      }
      const leftFromPreheat = this.getPreheatCountFor(
        this.disinfectionRoomSelectedFrom
      );
      this.disinfectionNeedQty = leftFromPreheat;

      this.addLog(`写入PLC DBW548（灭菌柜需进货数量）: ${leftFromPreheat}`);
      this.writeWordWithCancel('DBW548', leftFromPreheat);
    },
    // DBW550 解析柜需进货
    updateAnalysisNeedAndWrite() {
      if (!this.warehouseSelectedFrom) {
        this.analysisNeedQty = 0;
        this.addLog(`写入PLC DBW550（解析柜需进货数量）: 0 - 未选择解析柜`);
        this.writeWordWithCancel('DBW550', 0);
        return;
      }
      const leftFromSterilize = this.getSterilizeCountFor(
        this.warehouseSelectedFrom
      );
      this.analysisNeedQty = leftFromSterilize;

      this.addLog(`写入PLC DBW550（解析柜需进货数量）: ${leftFromSterilize}`);
      this.writeWordWithCancel('DBW550', leftFromSterilize);
    },
    // DBW560 出库需进货
    updateOutNeedAndWrite() {
      if (!this.outWarehouseSelected) {
        this.outNeedQty = 0;
        this.addLog(`写入PLC DBW560（出库需进货数量）: 0 - 未选择出库`);
        this.writeWordWithCancel('DBW560', 0);
        return;
      }
      // A/B/C 用解析房 A3/B3/C3；D/E 用下货队列（D出货/E出货）中的实际托盘数量。
      let need = 0;
      if (['A', 'B', 'C'].includes(this.outWarehouseSelected)) {
        need = this.getAnalysisCountFor(this.outWarehouseSelected);
      } else if (this.outWarehouseSelected === 'D') {
        // D出货队列：使用队列15中实际托盘数量
        need = this.queues[15]?.trayInfo?.length || 0;
      } else if (this.outWarehouseSelected === 'E') {
        // E出货队列：使用队列16中实际托盘数量
        need = this.queues[16]?.trayInfo?.length || 0;
      } else {
        need = 0;
      }
      this.outNeedQty = need;

      // 当正在执行且需进货数量为0时，自动切换为不执行
      if (
        need === 0 &&
        this.outWarehouseSelected &&
        this.outWarehouseTrayCode
      ) {
        const oldSelection = this.outWarehouseSelected;
        this.outWarehouseSelected = null;
        this.outWarehouseLoading = false; // 恢复loading状态
        this.outWarehouseTrayCode = '';
        this.$message.warning(
          `出库${oldSelection}执行中需进货数量为0，已自动切换为不执行`
        );
        this.addLog(
          `出库${oldSelection}执行中需进货数量为0，已自动切换为不执行`
        );
      }

      this.addLog(`写入PLC DBW560（出库需进货数量）: ${need}`);
      this.writeWordWithCancel('DBW560', need);
    },
    // DBW552 D灭菌柜需进货
    confirmDExecution() {
      if (!this.dExecQty || this.dExecQty <= 0) {
        this.dNeedQty = 0;
        this.dExecuting = false;
        this.addLog(`写入PLC DBW552（D灭菌柜需进货数量）: 0 - 未设置数量`);
        this.writeWordWithCancel('DBW552', 0);
        return;
      }
      this.dExecuting = true;
      const arrived = Number(this.dDisinfectionInQuantity) || 0;
      const need = Math.max(0, Number(this.dExecQty) - arrived);
      this.dNeedQty = need;

      this.addLog(`写入PLC DBW552（D灭菌柜需进货数量）: ${need}`);
      this.writeWordWithCancel('DBW552', need);
    },
    cancelDExecution() {
      this.dExecuting = false;
      this.dExecQty = undefined;
      this.dNeedQty = 0;
      // 取消执行时，取消允许上货
      this.allowUploadD = false;
      this.handleAllowUpload('D');
      this.addLog(`写入PLC DBW552（D灭菌柜需进货数量）: 0 - 取消执行`);
      this.writeWordWithCancel('DBW552', 0);
    },
    // DBW554 E灭菌柜需进货
    confirmEExecution() {
      if (!this.eExecQty || this.eExecQty <= 0) {
        this.eNeedQty = 0;
        this.eExecuting = false;
        this.addLog(`写入PLC DBW554（E灭菌柜需进货数量）: 0 - 未设置数量`);
        this.writeWordWithCancel('DBW554', 0);
        return;
      }
      this.eExecuting = true;
      const arrived = Number(this.eDisinfectionInQuantity) || 0;
      const need = Math.max(0, Number(this.eExecQty) - arrived);
      this.eNeedQty = need;

      this.addLog(`写入PLC DBW554（E灭菌柜需进货数量）: ${need}`);
      this.writeWordWithCancel('DBW554', need);
    },
    cancelEExecution() {
      this.eExecuting = false;
      this.eExecQty = undefined;
      this.eNeedQty = 0;
      // 取消执行时，取消允许上货
      this.allowUploadE = false;
      this.handleAllowUpload('E');
      this.addLog(`写入PLC DBW554（E灭菌柜需进货数量）: 0 - 取消执行`);
      this.writeWordWithCancel('DBW554', 0);
    },
    updateQuantity(quantityObj, key, change) {
      this[quantityObj][key] = Math.max(
        0,
        parseInt(this[quantityObj][key]) + change
      );
    },
    updateBufferQuantity(change) {
      this.bufferQuantity = Math.max(0, parseInt(this.bufferQuantity) + change);
    },
    // 测试模式：调节 D/E 的进货、出货数量（会触发对应 watch）
    updateDInQuantity(change) {
      this.dDisinfectionInQuantity = Math.max(
        0,
        parseInt(this.dDisinfectionInQuantity) + change
      );
    },
    updateEInQuantity(change) {
      this.eDisinfectionInQuantity = Math.max(
        0,
        parseInt(this.eDisinfectionInQuantity) + change
      );
    },
    updateDOutQuantity(change) {
      this.dDisinfectionOutQuantity = Math.max(
        0,
        parseInt(this.dDisinfectionOutQuantity) + change
      );
    },
    updateEOutQuantity(change) {
      this.eDisinfectionOutQuantity = Math.max(
        0,
        parseInt(this.eDisinfectionOutQuantity) + change
      );
    },
    // PLC变量写入测试方法
    writeInboundLine1() {
      const value = parseInt(this.plcWriteValues.inboundLine1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      // 设置loading状态
      this.plcWriteLoading.inboundLine1 = true;
      // 再写入目标变量值
      ipcRenderer.send('writeSingleValueToPLC', 'DBW564', value);
      // 先写入控制按钮值1
      ipcRenderer.send('writeSingleValueToPLC', 'DBW572_BIT0', true);
      // 2秒后取消写入
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW564');
        ipcRenderer.send('cancelWriteToPLC', 'DBW572_BIT0');
        // 取消loading，清零数值，显示成功提示
        this.plcWriteLoading.inboundLine1 = false;
        this.plcWriteValues.inboundLine1 = '';
        this.$message.success('入库1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW564（入库1线）: ${value}，2秒后恢复`);
    },
    writeInboundLine2() {
      const value = parseInt(this.plcWriteValues.inboundLine2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      // 设置loading状态
      this.plcWriteLoading.inboundLine2 = true;
      // 再写入目标变量值
      ipcRenderer.send('writeSingleValueToPLC', 'DBW566', value);
      // 先写入控制按钮值2
      ipcRenderer.send('writeSingleValueToPLC', 'DBW572_BIT1', true);
      // 2秒后取消写入
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW566');
        ipcRenderer.send('cancelWriteToPLC', 'DBW572_BIT1');
        // 取消loading，清零数值，显示成功提示
        this.plcWriteLoading.inboundLine2 = false;
        this.plcWriteValues.inboundLine2 = '';
        this.$message.success('入库2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW566（入库2线）: ${value}，2秒后恢复`);
    },
    writeBufferLine1() {
      const value = parseInt(this.plcWriteValues.bufferLine1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      // 设置loading状态
      this.plcWriteLoading.bufferLine1 = true;
      // 再写入目标变量值
      ipcRenderer.send('writeSingleValueToPLC', 'DBW568', value);
      // 先写入控制按钮值3
      ipcRenderer.send('writeSingleValueToPLC', 'DBW572_BIT2', true);
      // 2秒后取消写入
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW568');
        ipcRenderer.send('cancelWriteToPLC', 'DBW572_BIT2');
        // 取消loading，清零数值，显示成功提示
        this.plcWriteLoading.bufferLine1 = false;
        this.plcWriteValues.bufferLine1 = '';
        this.$message.success('缓存1#线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW568（缓存1#线）: ${value}，2秒后恢复`);
    },
    writeBufferLine2() {
      const value = parseInt(this.plcWriteValues.bufferLine2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      // 设置loading状态
      this.plcWriteLoading.bufferLine2 = true;
      // 再写入目标变量值
      ipcRenderer.send('writeSingleValueToPLC', 'DBW570', value);
      // 先写入控制按钮值4
      ipcRenderer.send('writeSingleValueToPLC', 'DBW572_BIT3', true);
      // 2秒后取消写入
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW570');
        ipcRenderer.send('cancelWriteToPLC', 'DBW572_BIT3');
        // 取消loading，清零数值，显示成功提示
        this.plcWriteLoading.bufferLine2 = false;
        this.plcWriteValues.bufferLine2 = '';
        this.$message.success('缓存2#线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW570（缓存2#线）: ${value}，2秒后恢复`);
    },
    writeBufferCount() {
      const value = parseInt(this.plcWriteValues.bufferCount);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      // 设置loading状态
      this.plcWriteLoading.bufferCount = true;
      // 再写入目标变量值
      ipcRenderer.send('writeSingleValueToPLC', 'DBW574', value);
      // 先写入控制按钮值
      ipcRenderer.send('writeSingleValueToPLC', 'DBW572_BIT5', true);
      // 2秒后取消写入
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW574');
        ipcRenderer.send('cancelWriteToPLC', 'DBW572_BIT5');
        // 取消loading，清零数值，显示成功提示
        this.plcWriteLoading.bufferCount = false;
        this.plcWriteValues.bufferCount = '';
        this.$message.success('缓存数量写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW574（缓存数量）: ${value}，2秒后恢复`);
    },
    releaseUpload() {
      // 设置loading状态
      this.plcWriteLoading.releaseUpload = true;
      // 写入控制按钮值5
      ipcRenderer.send('writeSingleValueToPLC', 'DBW572_BIT4', true);
      // 2秒后取消写入
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW572_BIT4');
        // 取消loading，显示成功提示
        this.plcWriteLoading.releaseUpload = false;
        this.$message.success('上货一键放行成功');
      }, 2000);
      this.addLog('上货一键放行，写入PLC DBW572_BIT4: true，2秒后恢复');
    },
    // A线写入
    writeA1Preheat1() {
      const value = parseInt(this.plcWriteValues.a1Preheat1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.a1Preheat1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW576', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW588_BIT0', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW576');
        ipcRenderer.send('cancelWriteToPLC', 'DBW588_BIT0');
        this.plcWriteLoading.a1Preheat1 = false;
        this.plcWriteValues.a1Preheat1 = '';
        this.$message.success('A1预热1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW576（A1预热1线）: ${value}，2秒后恢复`);
    },
    writeA1Preheat2() {
      const value = parseInt(this.plcWriteValues.a1Preheat2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.a1Preheat2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW578', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW588_BIT1', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW578');
        ipcRenderer.send('cancelWriteToPLC', 'DBW588_BIT1');
        this.plcWriteLoading.a1Preheat2 = false;
        this.plcWriteValues.a1Preheat2 = '';
        this.$message.success('A1预热2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW578（A1预热2线）: ${value}，2秒后恢复`);
    },
    writeA2Sterile1() {
      const value = parseInt(this.plcWriteValues.a2Sterile1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.a2Sterile1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW580', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW588_BIT2', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW580');
        ipcRenderer.send('cancelWriteToPLC', 'DBW588_BIT2');
        this.plcWriteLoading.a2Sterile1 = false;
        this.plcWriteValues.a2Sterile1 = '';
        this.$message.success('A2灭菌1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW580（A2灭菌1线）: ${value}，2秒后恢复`);
    },
    writeA2Sterile2() {
      const value = parseInt(this.plcWriteValues.a2Sterile2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.a2Sterile2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW582', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW588_BIT3', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW582');
        ipcRenderer.send('cancelWriteToPLC', 'DBW588_BIT3');
        this.plcWriteLoading.a2Sterile2 = false;
        this.plcWriteValues.a2Sterile2 = '';
        this.$message.success('A2灭菌2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW582（A2灭菌2线）: ${value}，2秒后恢复`);
    },
    writeA3Analysis1() {
      const value = parseInt(this.plcWriteValues.a3Analysis1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.a3Analysis1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW584', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW588_BIT4', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW584');
        ipcRenderer.send('cancelWriteToPLC', 'DBW588_BIT4');
        this.plcWriteLoading.a3Analysis1 = false;
        this.plcWriteValues.a3Analysis1 = '';
        this.$message.success('A3解析1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW584（A3解析1线）: ${value}，2秒后恢复`);
    },
    writeA3Analysis2() {
      const value = parseInt(this.plcWriteValues.a3Analysis2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.a3Analysis2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW586', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW588_BIT5', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW586');
        ipcRenderer.send('cancelWriteToPLC', 'DBW588_BIT5');
        this.plcWriteLoading.a3Analysis2 = false;
        this.plcWriteValues.a3Analysis2 = '';
        this.$message.success('A3解析2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW586（A3解析2线）: ${value}，2秒后恢复`);
    },
    // B线写入
    writeB1Preheat1() {
      const value = parseInt(this.plcWriteValues.b1Preheat1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.b1Preheat1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW590', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW602_BIT0', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW590');
        ipcRenderer.send('cancelWriteToPLC', 'DBW602_BIT0');
        this.plcWriteLoading.b1Preheat1 = false;
        this.plcWriteValues.b1Preheat1 = '';
        this.$message.success('B1预热1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW590（B1预热1线）: ${value}，2秒后恢复`);
    },
    writeB1Preheat2() {
      const value = parseInt(this.plcWriteValues.b1Preheat2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.b1Preheat2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW592', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW602_BIT1', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW592');
        ipcRenderer.send('cancelWriteToPLC', 'DBW602_BIT1');
        this.plcWriteLoading.b1Preheat2 = false;
        this.plcWriteValues.b1Preheat2 = '';
        this.$message.success('B1预热2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW592（B1预热2线）: ${value}，2秒后恢复`);
    },
    writeB2Sterile1() {
      const value = parseInt(this.plcWriteValues.b2Sterile1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.b2Sterile1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW594', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW602_BIT2', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW594');
        ipcRenderer.send('cancelWriteToPLC', 'DBW602_BIT2');
        this.plcWriteLoading.b2Sterile1 = false;
        this.plcWriteValues.b2Sterile1 = '';
        this.$message.success('B2灭菌1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW594（B2灭菌1线）: ${value}，2秒后恢复`);
    },
    writeB2Sterile2() {
      const value = parseInt(this.plcWriteValues.b2Sterile2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.b2Sterile2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW596', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW602_BIT3', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW596');
        ipcRenderer.send('cancelWriteToPLC', 'DBW602_BIT3');
        this.plcWriteLoading.b2Sterile2 = false;
        this.plcWriteValues.b2Sterile2 = '';
        this.$message.success('B2灭菌2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW596（B2灭菌2线）: ${value}，2秒后恢复`);
    },
    writeB3Analysis1() {
      const value = parseInt(this.plcWriteValues.b3Analysis1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.b3Analysis1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW598', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW602_BIT4', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW598');
        ipcRenderer.send('cancelWriteToPLC', 'DBW602_BIT4');
        this.plcWriteLoading.b3Analysis1 = false;
        this.plcWriteValues.b3Analysis1 = '';
        this.$message.success('B3解析1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW598（B3解析1线）: ${value}，2秒后恢复`);
    },
    writeB3Analysis2() {
      const value = parseInt(this.plcWriteValues.b3Analysis2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.b3Analysis2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW600', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW602_BIT5', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW600');
        ipcRenderer.send('cancelWriteToPLC', 'DBW602_BIT5');
        this.plcWriteLoading.b3Analysis2 = false;
        this.plcWriteValues.b3Analysis2 = '';
        this.$message.success('B3解析2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW600（B3解析2线）: ${value}，2秒后恢复`);
    },
    // C线写入
    writeC1Preheat1() {
      const value = parseInt(this.plcWriteValues.c1Preheat1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.c1Preheat1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW604', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW616_BIT0', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW604');
        ipcRenderer.send('cancelWriteToPLC', 'DBW616_BIT0');
        this.plcWriteLoading.c1Preheat1 = false;
        this.plcWriteValues.c1Preheat1 = '';
        this.$message.success('C1预热1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW604（C1预热1线）: ${value}，2秒后恢复`);
    },
    writeC1Preheat2() {
      const value = parseInt(this.plcWriteValues.c1Preheat2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.c1Preheat2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW606', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW616_BIT1', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW606');
        ipcRenderer.send('cancelWriteToPLC', 'DBW616_BIT1');
        this.plcWriteLoading.c1Preheat2 = false;
        this.plcWriteValues.c1Preheat2 = '';
        this.$message.success('C1预热2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW606（C1预热2线）: ${value}，2秒后恢复`);
    },
    writeC2Sterile1() {
      const value = parseInt(this.plcWriteValues.c2Sterile1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.c2Sterile1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW608', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW616_BIT2', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW608');
        ipcRenderer.send('cancelWriteToPLC', 'DBW616_BIT2');
        this.plcWriteLoading.c2Sterile1 = false;
        this.plcWriteValues.c2Sterile1 = '';
        this.$message.success('C2灭菌1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW608（C2灭菌1线）: ${value}，2秒后恢复`);
    },
    writeC2Sterile2() {
      const value = parseInt(this.plcWriteValues.c2Sterile2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.c2Sterile2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW610', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW616_BIT3', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW610');
        ipcRenderer.send('cancelWriteToPLC', 'DBW616_BIT3');
        this.plcWriteLoading.c2Sterile2 = false;
        this.plcWriteValues.c2Sterile2 = '';
        this.$message.success('C2灭菌2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW610（C2灭菌2线）: ${value}，2秒后恢复`);
    },
    writeC3Analysis1() {
      const value = parseInt(this.plcWriteValues.c3Analysis1);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.c3Analysis1 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW612', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW616_BIT4', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW612');
        ipcRenderer.send('cancelWriteToPLC', 'DBW616_BIT4');
        this.plcWriteLoading.c3Analysis1 = false;
        this.plcWriteValues.c3Analysis1 = '';
        this.$message.success('C3解析1线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW612（C3解析1线）: ${value}，2秒后恢复`);
    },
    writeC3Analysis2() {
      const value = parseInt(this.plcWriteValues.c3Analysis2);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.c3Analysis2 = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW614', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW616_BIT5', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW614');
        ipcRenderer.send('cancelWriteToPLC', 'DBW616_BIT5');
        this.plcWriteLoading.c3Analysis2 = false;
        this.plcWriteValues.c3Analysis2 = '';
        this.$message.success('C3解析2线写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW614（C3解析2线）: ${value}，2秒后恢复`);
    },
    // D\E线写入
    writeDSterileIn() {
      const value = parseInt(this.plcWriteValues.dSterileIn);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.dSterileIn = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW618', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW626_BIT0', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW618');
        ipcRenderer.send('cancelWriteToPLC', 'DBW626_BIT0');
        this.plcWriteLoading.dSterileIn = false;
        this.plcWriteValues.dSterileIn = '';
        this.$message.success('D线灭菌进写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW618（D线灭菌进）: ${value}，2秒后恢复`);
    },
    writeDSterileOut() {
      const value = parseInt(this.plcWriteValues.dSterileOut);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.dSterileOut = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW620', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW626_BIT1', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW620');
        ipcRenderer.send('cancelWriteToPLC', 'DBW626_BIT1');
        this.plcWriteLoading.dSterileOut = false;
        this.plcWriteValues.dSterileOut = '';
        this.$message.success('D线灭菌出写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW620（D线灭菌出）: ${value}，2秒后恢复`);
    },
    writeESterileIn() {
      const value = parseInt(this.plcWriteValues.eSterileIn);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.eSterileIn = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW622', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW626_BIT2', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW622');
        ipcRenderer.send('cancelWriteToPLC', 'DBW626_BIT2');
        this.plcWriteLoading.eSterileIn = false;
        this.plcWriteValues.eSterileIn = '';
        this.$message.success('E线灭菌进写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW622（E线灭菌进）: ${value}，2秒后恢复`);
    },
    writeESterileOut() {
      const value = parseInt(this.plcWriteValues.eSterileOut);
      if (isNaN(value)) {
        this.$message.warning('请输入有效的数值');
        return;
      }
      this.plcWriteLoading.eSterileOut = true;
      ipcRenderer.send('writeSingleValueToPLC', 'DBW624', value);
      ipcRenderer.send('writeSingleValueToPLC', 'DBW626_BIT3', true);
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW624');
        ipcRenderer.send('cancelWriteToPLC', 'DBW626_BIT3');
        this.plcWriteLoading.eSterileOut = false;
        this.plcWriteValues.eSterileOut = '';
        this.$message.success('E线灭菌出写入成功');
      }, 2000);
      this.addLog(`写入PLC DBW624（E线灭菌出）: ${value}，2秒后恢复`);
    },
    // 移除旧的D/E数量调节函数，D/E数量由PLC提供
    // 设置托盘顺序编号的方法
    setTraySequenceNumber(tray, queueIndex) {
      if (
        !tray ||
        !this.queues[queueIndex] ||
        !Array.isArray(this.queues[queueIndex].trayInfo)
      ) {
        return;
      }

      // 计算顺序编号：队列中已有托盘的数量 + 1，然后除以2向上取整（两个一组排序）
      const existingTrayCount = this.queues[queueIndex].trayInfo.filter(
        (t) => t.sequenceNumber && t.sequenceNumber > 0
      ).length;

      // 确保Vue响应式更新
      this.$set(tray, 'sequenceNumber', Math.ceil((existingTrayCount + 1) / 2));
    },
    // 发送到预热房的方法
    sendToPreheatingRoom() {
      if (!this.preheatingRoomSelected) {
        this.$message.warning('请先选择预热房');
        return;
      }

      // 检查缓存区队列中是否已经有sendTo是选择预热房的托盘
      if (this.queues[2] && Array.isArray(this.queues[2].trayInfo)) {
        const conflictTrays = this.queues[2].trayInfo.filter((tray) => {
          if (!tray.sendTo) return false;
          // 检查sendTo是否匹配当前选择的预热房
          const selectedRoom = this.preheatingRoomSelected;
          return tray.sendTo.startsWith(selectedRoom + '1-');
        });

        if (conflictTrays.length > 0) {
          const conflictTrayCodes = conflictTrays
            .map((tray) => tray.trayCode)
            .join('、');
          this.addLog(
            `缓存区队列中已有托盘（${conflictTrayCodes}）的预热房选择是${this.preheatingRoomSelected}，无法执行预热房操作，请先进行处理`
          );
          this.$message({
            message: `⚠️ 缓存区队列中已有托盘（${conflictTrayCodes}）的预热房选择是${this.preheatingRoomSelected}，无法执行预热房操作，请先进行处理`,
            type: 'warning',
            duration: 5000,
            showClose: true
          });
          return;
        }
      }

      // 判断起始地数量是否大于0（系统队列数量和PLC缓冲区数量都要大于0）
      const systemQueueCount =
        this.queues[2] && Array.isArray(this.queues[2].trayInfo)
          ? this.queues[2].trayInfo.length
          : 0;
      const plcBufferCount = this.bufferQuantity || 0;

      if (systemQueueCount <= 0 || plcBufferCount <= 0) {
        this.addLog('缓冲区队列中没有可用的托盘，请检查起始地数量');
        this.$message.warning('缓冲区队列中没有可用的托盘，请检查起始地数量');
        return;
      }
      // 锁定预热需进货量并写入DBW546
      if (this.preheatExecQty && this.preheatExecQty > 0) {
        // 设置loading状态
        this.preheatingRoomLoading = true;
        this.preheatExecuting = true;
        this.updatePreheatNeedAndWrite();
      } else {
        // 未设置需进货量直接执行，写0
        this.$message.warning('未填写执行数量，不可执行！');
        return;
      }
      // 映射预热房选项到队列索引和子队列名称前缀
      const roomMappings = {
        A: { queueIndex: 3, prefix: 'A1' },
        B: { queueIndex: 4, prefix: 'B1' },
        C: { queueIndex: 5, prefix: 'C1' }
      };

      const mapping = roomMappings[this.preheatingRoomSelected];

      if (mapping) {
        const targetQueue = this.queues[mapping.queueIndex];
        if (!targetQueue || !Array.isArray(targetQueue.trayInfo)) {
          console.error(`队列 ${mapping.prefix} 或其 trayInfo 无效`);
          this.$message.error(`处理 ${mapping.prefix} 预热房队列时出错`);
          return;
        }

        const subQueue1 = `${mapping.prefix}-1`;
        const subQueue2 = `${mapping.prefix}-2`;

        // 统计目标队列中托盘信息中已分配到两个子队列的数量
        const count1 = targetQueue.trayInfo.filter(
          (tray) => tray.sendTo === subQueue1
        ).length;
        const count2 = targetQueue.trayInfo.filter(
          (tray) => tray.sendTo === subQueue2
        ).length;

        // 决定发送到哪个子队列（数量少的优先，相等则优先第一个）
        const targetSendTo = count1 <= count2 ? subQueue1 : subQueue2;

        let trayFoundAndUpdated = false;
        // 遍历缓冲区队列，找到第一个未分配发送目标的托盘
        if (this.queues[2] && Array.isArray(this.queues[2].trayInfo)) {
          for (const tray of this.queues[2].trayInfo) {
            // 确保 tray 是一个有效对象并且有 sendTo 属性
            if (tray && typeof tray === 'object' && tray.sendTo === '') {
              tray.sendTo = targetSendTo;
              trayFoundAndUpdated = true;
              this.addLog(`托盘 ${tray.trayCode} 将发送到 ${targetSendTo}`);
              this.preWarmTrayCode = tray.trayCode;
              this.sendPreheatingToPLC(targetSendTo);
              break; // 找到并更新后退出循环
            }
          }
        } else {
          this.$message.error('处理缓冲区队列时出错');
          return;
        }

        if (!trayFoundAndUpdated) {
          this.addLog('缓冲区队列没有需要发送的托盘信息');
          this.$message.warning('缓冲区队列没有需要发送的托盘信息');
          return;
        }
        this.$message.success(`已将托盘分配到预热房 ${targetSendTo}`);
      } else {
        this.$message.error('无效的预热房选项');
      }
    },
    sendPreheatingToPLC(targetSendTo) {
      // 预热前小车信号请求时，判断本次发送请求的托盘是不是尾托盘
      // 判断方式：预热房选择卡片的需进货数量为1，本次托盘就是尾托盘
      const isLastTray = this.preheatNeedQty === 1;

      // 根据是否为尾托盘，向PLC的DBW558发送相应的值
      // 不是尾托盘发1，如果是尾托盘发2
      const dbw558Value = isLastTray ? 2 : 1;

      this.addLog(
        `预热前小车信号请求：托盘${this.preWarmTrayCode}${
          isLastTray ? '是' : '不是'
        }尾托盘，向PLC DBW558发送: ${dbw558Value}`
      );

      // 向PLC发送DBW558值
      ipcRenderer.send('writeSingleValueToPLC', 'DBW558', dbw558Value);

      // 2秒后取消DBW558的写入
      setTimeout(() => {
        ipcRenderer.send('cancelWriteToPLC', 'DBW558');
      }, 2000);

      // 原有的预热房命令发送逻辑
      if (targetSendTo === 'A1-1') {
        // 使用nodeS7协议，给PLC发送 011预热房A1-1启用进货、012预热房A1-2启用进货
        ipcRenderer.send('writeSingleValueToPLC', 'DBW524', 11);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW524');
        }, 2000);
      } else if (targetSendTo === 'A1-2') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW524', 12);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW524');
        }, 2000);
      } else if (targetSendTo === 'B1-1') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW524', 21);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW524');
        }, 2000);
      } else if (targetSendTo === 'B1-2') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW524', 22);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW524');
        }, 2000);
      } else if (targetSendTo === 'C1-1') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW524', 31);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW524');
        }, 2000);
      } else if (targetSendTo === 'C1-2') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW524', 32);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW524');
        }, 2000);
      }
    },
    // 发送到灭菌房的方法
    sendToDisinfectionRoom() {
      if (
        !this.disinfectionRoomSelectedFrom ||
        !this.disinfectionRoomSelectedTo
      ) {
        this.$message.warning('请先选择完整');
        return;
      }

      // 判断起始地数量是否大于0
      let sourceQueueIndex;
      if (this.disinfectionRoomSelectedFrom === 'A') {
        sourceQueueIndex = 3;
      } else if (this.disinfectionRoomSelectedFrom === 'B') {
        sourceQueueIndex = 4;
      } else if (this.disinfectionRoomSelectedFrom === 'C') {
        sourceQueueIndex = 5;
      }

      // 判断起始地数量是否大于0（系统队列数量和PLC预热房数量都要大于0）
      const systemQueueCount =
        this.queues[sourceQueueIndex] &&
        Array.isArray(this.queues[sourceQueueIndex].trayInfo)
          ? this.queues[sourceQueueIndex].trayInfo.length
          : 0;

      let plcPreheatCount = 0;
      if (this.disinfectionRoomSelectedFrom === 'A') {
        plcPreheatCount = this.aLineQuantity.a1 || 0;
      } else if (this.disinfectionRoomSelectedFrom === 'B') {
        plcPreheatCount = this.bLineQuantity.b1 || 0;
      } else if (this.disinfectionRoomSelectedFrom === 'C') {
        plcPreheatCount = this.cLineQuantity.c1 || 0;
      }

      if (systemQueueCount <= 0 || plcPreheatCount <= 0) {
        this.$message.warning(
          `${this.disinfectionRoomSelectedFrom}预热房中没有可用的托盘，请检查起始地数量`
        );
        return;
      }
      // 计算并存储目标总数量：起始地队列数量 + 目的地已有队列数量
      const sourceQueueCount = systemQueueCount;
      const destinationQueueCount = this.getSterilizeCountFor(
        this.disinfectionRoomSelectedTo
      );
      this.disinfectionTargetTotal = sourceQueueCount + destinationQueueCount;

      // 设置loading状态和执行状态
      this.disinfectionRoomLoading = true;
      this.disinfectionExecuting = true;
      if (this.disinfectionRoomSelectedFrom === 'A') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW526', 1);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW526');
        }, 2000);
        this.disinfectionTrayCode = this.queues[3].trayInfo[0].trayCode;
      } else if (this.disinfectionRoomSelectedFrom === 'B') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW526', 2);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW526');
        }, 2000);
        this.disinfectionTrayCode = this.queues[4].trayInfo[0].trayCode;
      } else if (this.disinfectionRoomSelectedFrom === 'C') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW526', 3);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW526');
        }, 2000);
        this.disinfectionTrayCode = this.queues[5].trayInfo[0].trayCode;
      }
      if (this.disinfectionRoomSelectedTo === 'A') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW528', 1);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW528');
        }, 2000);
      } else if (this.disinfectionRoomSelectedTo === 'B') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW528', 2);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW528');
        }, 2000);
      } else if (this.disinfectionRoomSelectedTo === 'C') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW528', 3);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW528');
        }, 2000);
      }
      this.updateDisinfectionNeedAndWrite();
      this.addLog(
        `执行发送从${this.disinfectionRoomSelectedFrom}预热房到${this.disinfectionRoomSelectedTo}灭菌房操作`
      );
      this.$message.success(
        `已发送从${this.disinfectionRoomSelectedFrom}预热房到${this.disinfectionRoomSelectedTo}灭菌房`
      );
    },
    sendDisinfectionRoomToWarehouse() {
      if (!this.warehouseSelectedFrom || !this.warehouseSelectedTo) {
        this.$message.warning('请先选择完整');
        return;
      }

      // 判断起始地数量是否大于0
      let sourceQueueIndex;
      if (this.warehouseSelectedFrom === 'A') {
        sourceQueueIndex = 6;
      } else if (this.warehouseSelectedFrom === 'B') {
        sourceQueueIndex = 7;
      } else if (this.warehouseSelectedFrom === 'C') {
        sourceQueueIndex = 8;
      }

      // 判断起始地数量是否大于0（系统队列数量和PLC灭菌柜数量都要大于0）
      const systemQueueCount =
        this.queues[sourceQueueIndex] &&
        Array.isArray(this.queues[sourceQueueIndex].trayInfo)
          ? this.queues[sourceQueueIndex].trayInfo.length
          : 0;

      let plcDisinfectionCount = 0;
      if (this.warehouseSelectedFrom === 'A') {
        plcDisinfectionCount = this.aLineQuantity.a2 || 0;
      } else if (this.warehouseSelectedFrom === 'B') {
        plcDisinfectionCount = this.bLineQuantity.b2 || 0;
      } else if (this.warehouseSelectedFrom === 'C') {
        plcDisinfectionCount = this.cLineQuantity.c2 || 0;
      }

      if (systemQueueCount <= 0 || plcDisinfectionCount <= 0) {
        this.$message.warning(
          `${this.warehouseSelectedFrom}灭菌柜中没有可用的托盘，请检查起始地数量`
        );
        return;
      }
      // 计算并存储目标总数量：起始地队列数量 + 目的地已有队列数量
      const sourceQueueCount = systemQueueCount;
      const destinationQueueCount = this.getAnalysisCountFor(
        this.warehouseSelectedTo
      );
      this.analysisTargetTotal = sourceQueueCount + destinationQueueCount;

      // 设置loading状态和执行状态
      this.analysisRoomLoading = true;
      this.analysisExecuting = true;
      if (this.warehouseSelectedFrom === 'A') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW530', 1);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW530');
        }, 2000);
        this.analysisTrayCode = this.queues[6].trayInfo[0].trayCode;
      } else if (this.warehouseSelectedFrom === 'B') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW530', 2);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW530');
        }, 2000);
        this.analysisTrayCode = this.queues[7].trayInfo[0].trayCode;
      } else if (this.warehouseSelectedFrom === 'C') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW530', 3);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW530');
        }, 2000);
        this.analysisTrayCode = this.queues[8].trayInfo[0].trayCode;
      }
      if (this.warehouseSelectedTo === 'A') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW532', 1);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW532');
        }, 2000);
      } else if (this.warehouseSelectedTo === 'B') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW532', 2);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW532');
        }, 2000);
      } else if (this.warehouseSelectedTo === 'C') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW532', 3);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW532');
        }, 2000);
      }
      this.addLog(
        `执行发送从灭菌柜${this.warehouseSelectedFrom}出库到解析库${this.warehouseSelectedTo}入库操作`
      );
      this.$message.success(
        `已发送从灭菌柜${this.warehouseSelectedFrom}出库到解析库${this.warehouseSelectedTo}入库`
      );
    },
    // 发送到立库的方法
    sendToWarehouse() {
      if (!this.outWarehouseSelected) {
        this.$message.warning('请先选择完整');
        return;
      }

      // 判断起始地数量是否大于0
      let sourceQueueIndex;
      if (this.outWarehouseSelected === 'A') {
        sourceQueueIndex = 9;
      } else if (this.outWarehouseSelected === 'B') {
        sourceQueueIndex = 10;
      } else if (this.outWarehouseSelected === 'C') {
        sourceQueueIndex = 11;
      } else if (this.outWarehouseSelected === 'D') {
        sourceQueueIndex = 15;
      } else if (this.outWarehouseSelected === 'E') {
        sourceQueueIndex = 16;
      }

      // 判断起始地数量是否大于0（系统队列数量和PLC解析库数量都要大于0）
      const systemQueueCount =
        this.queues[sourceQueueIndex] &&
        Array.isArray(this.queues[sourceQueueIndex].trayInfo)
          ? this.queues[sourceQueueIndex].trayInfo.length
          : 0;

      let plcWarehouseCount = 0;
      if (this.outWarehouseSelected === 'A') {
        plcWarehouseCount = this.aLineQuantity.a3 || 0;
      } else if (this.outWarehouseSelected === 'B') {
        plcWarehouseCount = this.bLineQuantity.b3 || 0;
      } else if (this.outWarehouseSelected === 'C') {
        plcWarehouseCount = this.cLineQuantity.c3 || 0;
      } else if (this.outWarehouseSelected === 'D') {
        plcWarehouseCount = this.dDisinfectionOutQuantity || 0;
      } else if (this.outWarehouseSelected === 'E') {
        plcWarehouseCount = this.eDisinfectionOutQuantity || 0;
      }

      if (systemQueueCount <= 0 || plcWarehouseCount <= 0) {
        this.$message.warning(
          `${this.outWarehouseSelected}解析库中没有可用的托盘，请检查起始地数量`
        );
        return;
      }
      // 设置loading状态和执行状态
      this.outWarehouseLoading = true;
      this.outWarehouseExecuting = true;
      if (this.outWarehouseSelected === 'A') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW534', 1);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW534');
        }, 2000);
        this.outWarehouseTrayCode = this.queues[9].trayInfo[0].trayCode;
      } else if (this.outWarehouseSelected === 'B') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW534', 2);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW534');
        }, 500);
        this.outWarehouseTrayCode = this.queues[10].trayInfo[0].trayCode;
      } else if (this.outWarehouseSelected === 'C') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW534', 3);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW534');
        }, 2000);
        this.outWarehouseTrayCode = this.queues[11].trayInfo[0].trayCode;
      } else if (this.outWarehouseSelected === 'D') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 1);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW536');
        }, 2000);
        this.outWarehouseTrayCode = this.queues[15].trayInfo[0]?.trayCode || '';
      } else if (this.outWarehouseSelected === 'E') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 2);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW536');
        }, 2000);
        this.outWarehouseTrayCode = this.queues[16].trayInfo[0]?.trayCode || '';
      } else if (this.outWarehouseSelected === 'DE') {
        ipcRenderer.send('writeSingleValueToPLC', 'DBW536', 3);
        setTimeout(() => {
          ipcRenderer.send('cancelWriteToPLC', 'DBW536');
        }, 2000);
      }
      this.addLog(`${this.outWarehouseSelected}执行发送出库操作`);
    },
    // 显示小车选择按钮
    showCarSelect() {
      // 判断缓冲区队列有没有托盘信息，没有托盘信息直接返回
      if (this.queues[2].trayInfo.length === 0) {
        this.$message.warning('缓冲区队列没有托盘信息，无法入库');
        return;
      }
      this.showCar1SetPreheatingRoom = true;
    },
    convertToWord(value) {
      if (value < 0) {
        return (value & 0xffff) >>> 0; // 负数转换为无符号的16位整数
      } else {
        return value; // 非负数保持不变
      }
    },
    // 触发请求上位机下发任务(判断去灭菌还是非灭菌)
    triggerRequestUploadTask() {
      this.requestUploadTask = 1;
      setTimeout(() => {
        this.requestUploadTask = 0;
      }, 1000);
    },
    // 触发请求上位机下发任务(预热小车前)
    triggerRequestUploadTaskPreheatingCar() {
      this.requestUploadTaskPreheatingCar = 1;
      setTimeout(() => {
        this.requestUploadTaskPreheatingCar = 0;
      }, 1000);
    },
    // 触发D出货请求信号
    triggerDDisinfectionOutSignal() {
      this.dDisinfectionOutSignal = 1;
      setTimeout(() => {
        this.dDisinfectionOutSignal = 0;
      }, 1000);
    },
    // 触发E出货请求信号
    triggerEDisinfectionOutSignal() {
      this.eDisinfectionOutSignal = 1;
      setTimeout(() => {
        this.eDisinfectionOutSignal = 0;
      }, 1000);
    },
    handleAllowUpload(type) {
      if (type === '1') {
        console.log('一楼', this.allowUploadOne);
        if (this.allowUploadOne) {
          ipcRenderer.send('writeValuesToPLC', 'DBW512', 1);
          this.addLog('一楼允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW512', 0);
          this.addLog('一楼禁止上货');
        }
      } else if (type === '2') {
        if (this.allowUploadTwo) {
          ipcRenderer.send('writeValuesToPLC', 'DBW514', 1);
          this.addLog('二楼允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW514', 0);
          this.addLog('二楼禁止上货');
        }
      } else if (type === '3') {
        if (this.allowUploadThree) {
          ipcRenderer.send('writeValuesToPLC', 'DBW516', 1);
          this.addLog('三楼允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW516', 0);
          this.addLog('三楼禁止上货');
        }
      } else if (type === '4') {
        if (this.allowUploadFour) {
          ipcRenderer.send('writeValuesToPLC', 'DBW518', 1);
          this.addLog('四楼允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW518', 0);
          this.addLog('四楼禁止上货');
        }
      } else if (type === 'D') {
        if (this.allowUploadD) {
          // 检查D上货数量是否已满（等于8）
          if (this.dDisinfectionInQuantity >= 8) {
            this.$message.warning('D上货队列已满，无法开始上货执行');
            this.allowUploadD = false;
            return;
          }
          // 检查E是否已经允许上货，如果是则禁止D允许上货
          if (this.allowUploadE) {
            this.$message.warning(
              'D和E灭菌柜不能同时允许上货，请先取消E灭菌柜的上货允许！'
            );
            this.allowUploadD = false;
            return;
          }
          // 检查是否填写了执行数量并确认
          if (!this.dExecQty || this.dExecQty <= 0) {
            this.$message.warning(
              '请先填写D灭菌柜执行数量并点击确定后再允许上货！'
            );
            // 不立即重置复选框，让用户手动取消或先填写数量
            setTimeout(() => {
              this.allowUploadD = false;
            }, 100);
            return;
          }
          if (!this.dExecuting) {
            this.$message.warning(
              '请先填写D灭菌柜执行数量并点击确定后再允许上货！'
            );
            // 不立即重置复选框，让用户手动取消或先确认执行
            setTimeout(() => {
              this.allowUploadD = false;
            }, 100);
            return;
          }
          // 重新计算并写入需进货数量
          const arrived = Number(this.dDisinfectionInQuantity) || 0;
          const need = Math.max(0, Number(this.dExecQty) - arrived);
          this.dNeedQty = need;
          this.addLog(`D允许上货时重新计算需进货数量: ${need}`);
          this.writeWordWithCancel('DBW552', need);
          // 发送允许上货信号
          ipcRenderer.send('writeValuesToPLC', 'DBW520', 1);
          this.addLog('D允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW520', 0);
          this.addLog('D禁止上货');
        }
      } else if (type === 'E') {
        if (this.allowUploadE) {
          // 检查E上货数量是否已满（等于8）
          if (this.eDisinfectionInQuantity >= 8) {
            this.$message.warning('E上货队列已满，无法开始上货执行');
            this.allowUploadE = false;
            return;
          }
          // 检查D是否已经允许上货，如果是则禁止E允许上货
          if (this.allowUploadD) {
            this.$message.warning(
              'D和E灭菌柜不能同时允许上货，请先取消D灭菌柜的上货允许！'
            );
            this.allowUploadE = false;
            return;
          }
          // 检查是否填写了执行数量并确认
          if (!this.eExecQty || this.eExecQty <= 0) {
            this.$message.warning(
              '请先填写E灭菌柜执行数量并点击确定后再允许上货！'
            );
            // 不立即重置复选框，让用户手动取消或先填写数量
            setTimeout(() => {
              this.allowUploadE = false;
            }, 100);
            return;
          }
          if (!this.eExecuting) {
            this.$message.warning(
              '请先填写E灭菌柜执行数量并点击确定后再允许上货！'
            );
            // 不立即重置复选框，让用户手动取消或先确认执行
            setTimeout(() => {
              this.allowUploadE = false;
            }, 100);
            return;
          }
          // 重新计算并写入需进货数量
          const arrived = Number(this.eDisinfectionInQuantity) || 0;
          const need = Math.max(0, Number(this.eExecQty) - arrived);
          this.eNeedQty = need;
          this.addLog(`E允许上货时重新计算需进货数量: ${need}`);
          this.writeWordWithCancel('DBW554', need);
          // 发送允许上货信号
          ipcRenderer.send('writeValuesToPLC', 'DBW522', 1);
          this.addLog('E允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW522', 0);
          this.addLog('E禁止上货');
        }
      }
    },
    // 更新数据库队列信息
    updateQueueInfo(id) {
      const param = {
        id: id,
        trayInfo: JSON.stringify(this.queues[id - 1].trayInfo)
      };
      HttpUtil.post('/queue_info/update', param).catch((err) => {
        this.$message.error(err);
      });
    },
    // 从数据库加载队列信息
    loadQueueInfoFromDatabase() {
      HttpUtil.post('/queue_info/queryQueueList', {})
        .then((res) => {
          if (res.data && res.data.length > 0) {
            // 遍历数据库返回的队列信息
            res.data.forEach((queueData) => {
              const queueId = queueData.id;
              const queueIndex = queueId - 1; // 数组索引从0开始，队列ID从1开始

              // 确保队列索引有效
              if (queueIndex >= 0 && queueIndex < this.queues.length) {
                try {
                  // 解析托盘信息JSON字符串
                  const trayInfo = queueData.trayInfo
                    ? JSON.parse(queueData.trayInfo)
                    : [];
                  // 赋值给对应的队列
                  this.queues[queueIndex].trayInfo = Array.isArray(trayInfo)
                    ? trayInfo
                    : [];
                  this.addLog(
                    `已加载队列${queueData.queueName || queueId}的托盘信息，共${
                      this.queues[queueIndex].trayInfo.length
                    }个托盘`
                  );
                } catch (error) {
                  console.error(`解析队列${queueId}的托盘信息失败:`, error);
                  this.queues[queueIndex].trayInfo = [];
                  this.addLog(`队列${queueId}托盘信息解析失败，已重置为空`);
                }
              }
            });
            this.addLog('队列信息加载完成');
          } else {
            this.addLog('数据库中暂无队列信息');
          }
        })
        .catch((err) => {
          console.error('加载队列信息失败:', err);
          this.$message.error('加载队列信息失败: ' + err);
          this.addLog('队列信息加载失败');
        });
    },
    // 切换到报警日志时清除未读状态
    switchToAlarmLog() {
      this.activeLogType = 'alarm';
      // 清除所有报警日志的未读状态
      this.alarmLogs.forEach((log) => {
        log.unread = false;
      });
    }
  }
};
</script>
<style lang="less" scoped>
.smart-workshop {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, #83b3de, #ffffff);
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0;
  font-family: 'Roboto', sans-serif;
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  .header {
    position: relative;
    width: 100%;
    height: 80px;
    overflow: hidden;
    flex-shrink: 0;
    .header-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-content {
      position: relative;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      z-index: 1;
      .title {
        font-size: 32px;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        letter-spacing: 2px;
      }

      .current-time {
        font-size: 24px;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
    }
  }
  .content-wrapper {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
    .side-info-panel {
      width: 420px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 5px;
      box-sizing: border-box;
      flex-shrink: 0;
      overflow: hidden;
      .plc-info-section,
      .operation-panel {
        background: #052438;
        padding: 10px;
        border-radius: 15px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
        color: #f5f5f5;
        box-sizing: border-box;
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 22px;
          color: #0ac5a8;
          font-weight: 900;
          margin-bottom: 5px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .el-button {
            background: rgba(10, 197, 168, 0.2);
            border: 1px solid rgba(10, 197, 168, 0.3);
            color: #0ac5a8;
            font-size: 12px;
          }
          .el-button:hover {
            background: rgba(10, 197, 168, 0.3);
            border-color: rgba(10, 197, 168, 0.5);
            color: #fff;
          }
        }
        .scrollable-content {
          overflow-y: auto;
        }
      }
      .plc-info-section {
        .scrollable-content {
          .status-overview {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            .data-card {
              box-sizing: border-box;
              height: 65px;
              width: 185px;
            }

            .data-card-border {
              width: 100%;
              height: 100%;
              border-radius: 20px;
              background: linear-gradient(135deg, #2b3d51, #3c4c63);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            }

            .data-card-border-borderTop {
              font-weight: 400;
              letter-spacing: 0px;
              color: rgba(189, 189, 189, 1);
              text-align: left;
              vertical-align: top;
              font-size: 13px;
              line-height: 34px;
              padding-left: 12px;
            }
            .granient-text {
              background-image: linear-gradient(
                to right,
                rgba(72, 146, 254, 1),
                rgba(71, 207, 245, 1)
              );
              background-clip: text;
              -webkit-background-clip: text;
              color: transparent;
            }

            .data-card-border-borderDown {
              font-weight: 700;
              letter-spacing: 0px;
              color: rgba(255, 255, 255, 1);
              text-align: left;
              vertical-align: top;
              font-size: 24px;
              line-height: 21px;
              padding-left: 12px;
              /* 添加省略号效果 */
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
              display: block;
            }
          }
        }
      }
      .log-section {
        background: #052438;
        padding: 10px;
        border-radius: 15px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
        height: 257px;
        display: flex;
        flex-direction: column;
        flex: 1;
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0px 0px 8px 0px;
          color: #0ac5a8;
          font-size: 22px;
          font-weight: 900;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          .log-tabs {
            display: flex;
            gap: 5px;
          }
          .log-tab {
            position: relative;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            padding: 5px 15px;
            border-radius: 4px;
            transition: all 0.3s ease;
            .alarm-badge {
              position: absolute;
              top: -8px;
              right: -8px;
              background: #f56c6c;
              color: #fff;
              font-size: 12px;
              padding: 2px 6px;
              border-radius: 10px;
              min-width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
          .log-tab.active {
            color: #fff;
            background: rgba(10, 197, 168, 0.2);
          }
          .log-tab:hover:not(.active) {
            color: #0ac5a8;
          }
        }
        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px 0;
          .log-list {
            padding: 0 10px;
            width: 100%;
            box-sizing: border-box;
            .log-item {
              background: rgba(255, 255, 255, 0.03);
              border-radius: 4px;
              padding: 10px;
              margin-bottom: 8px;
              cursor: pointer;
              width: 100%;
              box-sizing: border-box;
              .log-time {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.4);
                margin-bottom: 6px;
              }
              .log-item-content {
                color: rgba(255, 255, 255, 0.9);
                font-size: 13px;
                line-height: 1.6;
                overflow-wrap: break-word;
                word-wrap: break-word;
                word-break: normal;
                hyphens: auto;
                display: block;
                width: 100%;
                padding-right: 10px;
              }
            }
            .log-item:hover {
              background: rgba(255, 255, 255, 0.05);
            }

            .log-item.alarm {
              background: rgba(245, 108, 108, 0.05);
            }

            .log-item.alarm.unread {
              background: rgba(245, 108, 108, 0.1);
              border-left: 2px solid #f56c6c;
            }
            /* 添加空状态样式 */
            .empty-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px 0;
              color: rgba(255, 255, 255, 0.6);
              i {
                font-size: 48px;
                margin-bottom: 16px;
                color: rgba(255, 255, 255, 0.3);
              }
              p {
                font-size: 14px;
                margin: 0 0 16px 0;
              }
              .el-button {
                color: #0ac5a8;
                font-size: 14px;
                i {
                  font-size: 14px;
                  margin-right: 4px;
                  color: inherit;
                }
              }
              .el-button:hover {
                color: #0db196;
              }
            }
          }
        }
        .scrollable-content::-webkit-scrollbar {
          width: 4px;
        }

        .scrollable-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollable-content::-webkit-scrollbar-thumb {
          background: rgba(10, 197, 168, 0.2);
          border-radius: 2px;
        }

        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: rgba(10, 197, 168, 0.4);
        }
      }
      .operation-panel {
        .operation-buttons {
          display: flex;
          justify-content: flex-start;
          gap: 8px;
          margin-top: 5px;
          padding: 5px;
          button {
            width: 70px;
            height: 70px;
            font-size: 0.8em;
            color: #fff;
            background: linear-gradient(135deg, #0ac5a8, #0f6b58);
            border: none;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 8px;
            gap: 5px;
            i {
              font-size: 1.8em;
            }
            span {
              font-size: 12px;
              margin-top: 4px;
            }
          }
          button:hover {
            background: linear-gradient(135deg, #4caf50, #0f6b58);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
          }
          button.pressed {
            background: linear-gradient(135deg, #4caf50, #2e8b57);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
            transform: scale(0.95);
          }
        }
      }
    }
    .main-content {
      flex: 1;
      display: flex;
      padding: 5px 5px 5px 0px;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      .floor-container {
        display: flex;
        gap: 10px;
        height: 100%;
        width: 100%;
        min-height: 0;

        .floor-left {
          .floor-image-container {
            flex: 1;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-height: 0;
            height: calc(100% - 50px);
            position: relative;
            .image-wrapper {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              .floor-image {
                display: block;
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                object-fit: contain;
              }
              /* --- 光电点位样式 --- */
              .marker {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                pointer-events: auto;
                .marker-label {
                  position: absolute;
                  white-space: nowrap;
                  background: #0ac5a8;
                  color: #fff;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  /* 默认定位在下方 */
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                  opacity: 0;
                  transition: opacity 0.3s;
                  pointer-events: none; /* 添加此行 */
                }
              }
              .marker::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: rgba(128, 128, 128, 0.8); /* 默认灰色核心 */
              }
              /* 扫描状态 (红色) */
              .marker.scanning::before {
                background: rgba(255, 0, 0, 0.8); /* 红色核心 */
              }

              /* 默认隐藏标签，hover时显示 */
              .marker:hover .marker-label {
                opacity: 1;
                box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); /* 灰色辉光 */
              }
              /* 始终显示标签的点位 */
              .marker-show-label .marker-label {
                opacity: 1;
              }
              /* 控制标签位置的样式 */
              .marker.label-top .marker-label {
                top: auto; /* 重置默认 top */
                bottom: calc(100% + 5px); /* 定位到上方 */
                left: 50%;
                transform: translateX(-50%);
              }
              .marker.label-left .marker-label {
                top: 50%; /* 垂直居中 */
                left: auto; /* 重置默认 left */
                right: calc(100% + 5px); /* 定位到左方 */
                transform: translateY(-50%); /* 垂直居中 */
              }
              .marker.label-right .marker-label {
                top: 50%; /* 垂直居中 */
                left: calc(100% + 5px); /* 定位到右方 */
                transform: translateY(-50%); /* 垂直居中 */
              }
              /* --- 光电点位样式结束 --- */

              /* --- 新增电机点位样式 --- */
              .motor-marker {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                pointer-events: auto;
                .marker-label {
                  position: absolute;
                  white-space: nowrap;
                  background: rgba(0, 0, 0, 0.8);
                  color: #fff;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  /* 默认定位在下方 */
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                  opacity: 0; /* 默认隐藏 */
                  transition: opacity 0.3s;
                }
              }

              .motor-marker::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(128, 128, 128, 0.8); /* 默认灰色方块 */
                /* 无 border-radius，保持方形 */
              }

              .motor-marker.running::before {
                background: #00ff3f; /* 运行状态绿色方块 */
              }

              /* 始终显示电机标签 */
              .motor-marker.marker-show-label .marker-label {
                opacity: 1;
              }
              /* 悬停显示电机标签 */
              .motor-marker:hover .marker-label {
                opacity: 1;
              }

              /* 控制电机标签位置的样式 (复制并适配) */
              .motor-marker.label-top .marker-label {
                top: auto;
                bottom: calc(100% + 5px);
                left: 50%;
                transform: translateX(-50%);
              }
              .motor-marker.label-left .marker-label {
                top: 50%;
                left: auto;
                right: calc(100% + 5px);
                transform: translateY(-50%);
              }
              .motor-marker.label-right .marker-label {
                top: 50%;
                left: calc(100% + 5px);
                transform: translateY(-50%);
              }
              /* --- 电机点位样式结束 --- */

              /* 带数据面板的标识点样式 */
              .marker-with-panel {
                position: absolute;
                width: 16px;
                height: 16px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                .data-panel {
                  position: absolute;
                  background: linear-gradient(135deg, #0e1a27, #3c4c63);
                  border: 1px solid rgba(64, 158, 255, 0.3);
                  border-radius: 8px;
                  padding: 12px;
                  width: 170px;
                  // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  opacity: 0;
                  transition: all 0.3s ease;
                  pointer-events: none;
                  .data-panel-header {
                    font-size: 14px;
                    color: #409eff;
                    margin-bottom: 6px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(64, 158, 255, 0.2);
                  }
                  .data-panel-content {
                    font-size: 12px;
                    .data-panel-row {
                      display: flex;
                      justify-content: space-between;
                      color: rgba(255, 255, 255, 0.9);
                      .data-panel-label {
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                      }
                    }
                    /* 新增：复选框组样式 */
                    .checkbox-group {
                      display: flex;
                      justify-content: space-between; /* 或 space-between */
                      align-items: center;
                      padding-top: 5px; /* 增加一点顶部间距 */
                    }

                    .checkbox-group .el-checkbox {
                      margin-right: 10px; /* 增加复选框之间的间距 */
                    }

                    /* 调整复选框标签颜色 */
                    .checkbox-group :deep(.el-checkbox__label) {
                      color: rgba(255, 255, 255, 0.8); /* 调整标签颜色 */
                      font-size: 12px; /* 调整标签字体大小 */
                    }

                    /* 执行控制区域的特殊样式 */
                    .exec-controls {
                      display: flex;
                      align-items: center;
                      gap: 3px;
                    }

                    /* 调整选中状态下的颜色 */
                    .checkbox-group
                      :deep(
                        .el-checkbox__input.is-checked + .el-checkbox__label
                      ) {
                      color: #0ac5a8; /* 选中时标签颜色 */
                    }

                    .checkbox-group
                      :deep(
                        .el-checkbox__input.is-checked .el-checkbox__inner
                      ) {
                      background-color: #0ac5a8; /* 选中时背景色 */
                      border-color: #0ac5a8; /* 选中时边框色 */
                    }
                  }
                }

                /* 管理员密码对话框样式 */
                .admin-password-content {
                  padding: 20px 0;
                }

                .admin-password-content .el-form-item {
                  margin-bottom: 20px;
                }

                .admin-password-content .el-input {
                  width: 100%;
                }

                .dialog-footer {
                  text-align: right;
                  padding-top: 20px;
                }
                /* 面板位置样式 */
                .data-panel.position-right {
                  left: calc(100% + 15px);
                  top: 50%;
                  transform: translateY(-50%);
                }
                .data-panel.position-left {
                  right: calc(100% + 15px);
                  top: 50%;
                  transform: translateY(-50%);
                }
                .data-panel.position-top {
                  bottom: calc(100% + 15px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                .data-panel.position-bottom {
                  top: calc(100% + 15px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                /* 始终显示的面板 */
                .data-panel.always-show {
                  opacity: 1;
                  pointer-events: auto; /* 重新启用指针事件 */
                }
                /* 竖向布局样式 */
                .data-panel.vertical-layout {
                  width: 110px;
                  padding: 8px;
                  .data-panel-row {
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 8px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                  }
                  .data-panel-label {
                    margin-bottom: 2px;
                  }
                }
              }
              /* 悬停时显示面板 */
              .marker-with-panel:hover .data-panel:not(.always-show) {
                opacity: 1;
              }

              /* 带按钮的标识点样式 */
              .marker-with-button {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 5;
                cursor: pointer;
              }
              .marker-with-button .warehouse-btn {
                background: linear-gradient(135deg, #0e1a27, #3c4c63);
                color: white;
                font-weight: bold;
                border: none;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                border-radius: 4px;
                padding: 10px 15px;
                transition: all 0.3s ease;
              }
              .marker-with-button .warehouse-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
              }

              /* 预热房选择样式 */
              .preheating-room-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 10;
                background: linear-gradient(135deg, #005aff 0%, #000000 100%);
                border-radius: 5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                width: 80px;
                .preheating-room-content {
                  display: flex;
                  flex-direction: column;
                  width: 100%;
                  .preheating-room-header {
                    width: 100%;
                    text-align: center;
                    padding: 4px 0;
                    font-size: 11px;
                    color: white;
                    background-color: rgba(0, 0, 0, 0.2);
                    font-weight: bold;
                  }
                  .preheating-room-body {
                    padding: 6px 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                  }
                }
              }
              .preheating-room-marker :deep(.el-select) {
                width: 100%;
              }
              .preheating-room-marker :deep(.el-input__inner) {
                background-color: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.2);
                color: #fff;
                height: 24px;
                line-height: 24px;
                font-size: 11px;
                border-radius: 3px;
                padding: 0 8px;
              }

              /* 解析状态标签样式 */
              .analysis-status-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 15;
              }

              /* 自定义状态标签样式，让绿色更突出 */
              .analysis-status-marker :deep(.el-tag) {
                background-color: #00cc44;
                border: 1px solid #00aa33;
                color: #ffffff;
              }
            }
          }
        }
        .floor-left {
          flex: 1;
          background: #07293e;
          padding: 10px;
          border-radius: 15px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
          color: #f5f5f5;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;
          .floor-title {
            font-size: 22px;
            color: #0ac5a8;
            font-weight: 900;
            padding-bottom: 10px;
            flex-shrink: 0;
          }
          .floor-image-container {
            .image-wrapper {
              .queue-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 10;
                background: rgba(10, 30, 50, 0.85);
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid rgba(64, 158, 255, 0.5);
                transition: all 0.3s ease;
                min-width: 40px;
                text-align: center;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                color: #ffffff;
                .queue-marker-content {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  color: #fff;
                  font-size: 12px;
                  .queue-marker-name {
                    color: #fff;
                  }

                  .queue-marker-count {
                    font-size: 14px;
                    font-weight: bold;
                    color: #409eff;
                  }
                }
              }
              .queue-marker:hover {
                background: rgba(24, 61, 97, 0.9);
                border-color: rgba(64, 158, 255, 0.6);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
              }

              /* 特殊队列标记样式 - 上货1、上货2、缓存区1、缓存区2 */
              .special-queue {
                background: rgba(0, 123, 191, 0.9) !important;
                border: 1px solid rgba(0, 123, 191, 0.7) !important;
              }

              .special-queue .queue-marker-count {
                color: #ffffff !important;
              }

              .special-queue .queue-marker-name {
                color: #ffffff !important;
              }

              .special-queue:hover {
                background: rgba(0, 123, 191, 0.95) !important;
                border-color: rgba(40, 167, 235, 0.8) !important;
              }

              /* 添加小车样式 */
              .cart-container {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 3;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              }

              .cart-image {
                width: 100%;
                height: auto;
                object-fit: contain;
              }
            }
          }
        }
      }
    }
  }
  .side-info-panel-queue {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    padding: 0;
    box-sizing: border-box;
    transition: all 0.3s ease;
    pointer-events: auto;
    /* 基础样式 */
    .queue-section {
      background: rgba(30, 42, 56);
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
      color: #f5f5f5;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.1);
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: color 0.3s ease;
        font-size: 20px;
        color: #0ac5a8;
        font-weight: 900;
        padding-bottom: 12px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }
      .expandable-content-queue {
        flex: 1;
        min-height: 0;
        display: flex;
        overflow: hidden;
        height: calc(100% - 50px);
        .queue-container {
          flex: 1;
          display: flex;
          background: rgba(30, 42, 56, 0.9);
          border-radius: 12px;
          padding: 15px;
          gap: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: 100%;
          min-height: 0;
          box-sizing: border-box;
          .queue-container-left {
            width: 280px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            padding-right: 15px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            height: 100%;
            min-height: 0;
            /* 队列项样式 */
            .queue {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: rgba(48, 65, 85, 0.9);
              border-radius: 8px;
              padding: 12px 15px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              border: 1px solid rgba(255, 255, 255, 0.15);
              .tray-count {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 10px;
                min-width: 24px;
                text-align: center;
              }
            }

            .queue:hover {
              background: rgba(48, 65, 85, 1);
              border-color: rgba(10, 197, 168, 0.5);
              transform: translateX(2px);
            }

            .queue.active {
              background: rgba(10, 197, 168, 0.15);
              border-color: rgba(10, 197, 168, 0.5);
            }
          }
          /* 滚动条样式 */
          .queue-container-left::-webkit-scrollbar,
          .tray-list::-webkit-scrollbar {
            width: 4px;
          }

          .queue-container-left::-webkit-scrollbar-track,
          .tray-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 2px;
          }

          .queue-container-left::-webkit-scrollbar-thumb,
          .tray-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
          }

          .queue-container-left::-webkit-scrollbar-thumb:hover,
          .tray-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          .queue-container-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 0 15px;
            height: 100%;
            min-height: 0;
            .selected-queue-header {
              flex-shrink: 0;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
              h3 {
                margin: 0;
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
              }
              .queue-header-actions {
                display: flex;
                align-items: center;
                gap: 12px;
                .el-button {
                  background: rgba(10, 197, 168, 0.2);
                  border: 1px solid rgba(10, 197, 168, 0.3);
                  color: #0ac5a8;
                }
                .el-button:hover:not(:disabled) {
                  background: rgba(10, 197, 168, 0.3);
                  border-color: rgba(10, 197, 168, 0.5);
                  color: #fff;
                }
                .tray-total {
                  background: rgba(255, 255, 255, 0.1);
                  color: rgba(255, 255, 255, 0.7);
                  font-size: 13px;
                  padding: 4px 12px;
                  border-radius: 15px;
                  cursor: pointer;
                }
              }
            }
            .tray-list {
              flex: 1;
              overflow-y: auto;
              min-height: 0;
              padding-right: 5px;

              /* 托盘项样式 */
              .tray-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(48, 65, 85, 0.9);
                margin: 0 0 8px 0;
                padding: 12px 15px;
                border-radius: 8px;
                cursor: move;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.15);
                position: relative;

                .tray-info {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                  width: 100%;
                  .tray-info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    .tray-name {
                      font-weight: 500;
                      color: rgba(255, 255, 255, 0.9);
                      font-size: 14px;
                    }

                    .tray-batch-group {
                      display: flex;
                      align-items: center;
                      gap: 4px;
                      flex-wrap: wrap;
                      justify-content: flex-end;
                    }

                    .tray-batch {
                      font-size: 12px;
                      color: #0ac5a8;
                      background: rgba(10, 197, 168, 0.1);
                      padding: 2px 8px;
                      border-radius: 4px;
                      white-space: nowrap;

                      .sequence-number {
                        color: #ffa500;
                        font-weight: bold;
                        margin-left: 4px;
                      }
                    }

                    .tray-detail {
                      font-size: 11px;
                      color: rgba(255, 255, 255, 0.7);
                      word-break: break-word;
                      line-height: 1.4;
                      flex: 1;
                      text-align: left;
                    }
                  }
                  .tray-time {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                  }
                }
                .tray-actions {
                  display: flex;
                  gap: 4px;
                  position: absolute;
                  right: 10px;
                  top: 50%;
                  transform: translateY(-50%);
                  opacity: 0;
                  transition: opacity 0.3s ease;
                }

                .move-btn {
                  width: 24px;
                  height: 24px;
                  padding: 0;
                  border-radius: 50%;

                  &:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                  }

                  &:not(.is-disabled):hover {
                    background-color: #409eff;
                    border-color: #409eff;
                  }
                }

                .el-button {
                  &:not(.move-btn) {
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    border-radius: 50%;
                  }
                }
              }
              .tray-item:hover {
                background: rgba(48, 65, 85, 1);
                border-color: rgba(10, 197, 168, 0.5);
                transform: translateX(2px);
                .tray-actions {
                  opacity: 1;
                }
              }
              .tray-item:last-child {
                margin-bottom: 0;
              }
              .tray-item.dragging {
                opacity: 0.6;
                transform: scale(0.98);
                border: 1px dashed rgba(255, 255, 255, 0.3);
              }
              /* 添加空状态样式 */
              .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 0;
                color: rgba(255, 255, 255, 0.6);
                i {
                  font-size: 48px;
                  margin-bottom: 16px;
                  color: rgba(255, 255, 255, 0.3);
                }
                p {
                  font-size: 14px;
                  margin: 0 0 16px 0;
                }
                .el-button {
                  color: #0ac5a8;
                  font-size: 14px;
                  i {
                    font-size: 14px;
                    margin-right: 4px;
                    color: inherit;
                  }
                }
                .el-button:hover {
                  color: #0db196;
                }
              }
            }
          }
        }
      }
    }
    /* 展开状态的样式 */
    .queue-section.expanded {
      padding: 15px;
      width: 850px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    /* 收起状态的样式 */
    .queue-section:not(.expanded) {
      width: 40px;
      height: 40px;
      padding: 0;
      background: none;
      box-shadow: none;
      border: none;
      .section-header {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #0ac5a8;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        padding: 0;
        span {
          display: none;
        }
        i {
          color: #fff;
          font-size: 20px;
          animation: rotate 10s linear infinite;
        }
      }
      .section-header:hover {
        transform: scale(1.1);
        background: #0db196;
      }
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}

/* 添加新的测试面板样式 */
.test-panel-container {
  position: absolute; /* 修改位置，为测试按钮留出空间 */
  right: 80px; /* 修改位置，为队列按钮留出空间 */
  top: 20px;
  z-index: 1000;
}

.test-toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #0ac5a8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.test-toggle-btn:hover {
  transform: scale(1.1);
  background: #0db196;
}

.test-toggle-btn i {
  color: #fff;
  font-size: 20px;
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.test-panel {
  position: absolute;
  right: 50px;
  top: 0;
  width: 300px;
  max-height: 80vh; /* 限制最大高度为视窗高度的80% */
  background: rgba(30, 42, 56, 0.98);
  border: 1px solid rgba(10, 197, 168, 0.3);
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  transform-origin: top right;
  opacity: 1;
  transform: scale(1);
  display: flex;
  flex-direction: column;
}

.test-panel.collapsed {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

.test-panel-header {
  padding: 15px;
  background: rgba(10, 197, 168, 0.3);
  border-radius: 15px 15px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0ac5a8;
  font-weight: bold;
  pointer-events: auto;
  flex-shrink: 0;
}

.test-panel-content {
  padding: 15px;
  overflow-y: auto;
  pointer-events: auto;
  flex: 1;
}

/* 添加滚动条样式 */
.test-panel-content::-webkit-scrollbar {
  width: 4px;
}

.test-panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.test-panel-content::-webkit-scrollbar-thumb {
  background: rgba(10, 197, 168, 0.3);
  border-radius: 2px;
}

.test-panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(10, 197, 168, 0.5);
}

.test-panel-header i {
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-panel-header i:hover {
  color: #ff4d4f;
}

.test-section {
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.4);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(10, 197, 168, 0.1);
}

.test-label {
  display: block;
  color: #0ac5a8;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
}

.position-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  pointer-events: auto;
}

.position-btn {
  padding: 6px 12px;
  background: rgba(10, 197, 168, 0.3);
  border: 1px solid rgba(10, 197, 168, 0.5);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.position-btn:hover {
  background: rgba(10, 197, 168, 0.5);
}

.position-btn:active {
  transform: scale(0.95);
}

/* 小车位置滑块样式 */
.cart-position-test-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.cart-position-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-position-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-value {
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #0ac5a8;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.cart-position-slider-container {
  padding: 5px 0;
}

.cart-position-slider {
  width: 100%;
}

.cart-position-slider :deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.1);
  height: 6px;
}

.cart-position-slider :deep(.el-slider__bar) {
  background-color: #0ac5a8;
  height: 6px;
}

.cart-position-slider :deep(.el-slider__button) {
  border: 2px solid #0ac5a8;
  background-color: #fff;
  width: 20px;
  height: 20px;
}

.cart-position-slider :deep(.el-slider__button:hover) {
  border-color: #0ac5a8;
  box-shadow: 0 0 5px rgba(10, 197, 168, 0.5);
}

/* 测试添加结束 */

.qrcode-test-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.qrcode-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qrcode-label {
  width: 80px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.send-label {
  width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.qrcode-input {
  flex: 1;
}

.qrcode-input :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #fff;
}

.qrcode-input :deep(.el-input__inner:hover),
.qrcode-input :deep(.el-input__inner:focus) {
  border-color: #0ac5a8;
}

.qrcode-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.qrcode-actions .el-button {
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #0ac5a8;
}

.qrcode-actions .el-button:hover {
  background: rgba(10, 197, 168, 0.3);
  border-color: rgba(10, 197, 168, 0.5);
  color: #fff;
}

/* PLC 变量写入测试分组样式 */
.plc-test-wrapper :deep(.el-collapse) {
  border: none;
  background: transparent;
}

.plc-test-wrapper :deep(.el-collapse-item__header) {
  background: rgba(10, 197, 168, 0.1);
  color: #0ac5a8;
  border: none;
  padding: 0 10px;
  height: 32px;
  line-height: 32px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
}

.plc-test-wrapper :deep(.el-collapse-item__header.is-active) {
  background: rgba(10, 197, 168, 0.2);
}

.plc-test-wrapper :deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

.plc-test-wrapper :deep(.el-collapse-item__content) {
  padding: 8px 4px;
  color: #fff;
}

.compact-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.compact-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.compact-label {
  width: 70px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
  text-align: right;
}

.plc-test-wrapper :deep(.el-input--mini .el-input__inner) {
  height: 24px;
  line-height: 24px;
  padding: 0 5px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #fff;
}

.plc-test-wrapper :deep(.el-button--mini) {
  padding: 4px 8px;
  min-width: 32px;
}

/* 添加队列移动相关样式 */
.queue-move-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.queue-select-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.queue-move-label {
  width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.queue-move-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.upload-area-actions {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  display: flex;
  justify-content: center;
}

.upload-area-actions .el-button {
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #0ac5a8;
  width: 100%;
}

.upload-area-actions .el-button:hover:not(:disabled) {
  background: rgba(10, 197, 168, 0.3);
  border-color: rgba(10, 197, 168, 0.5);
  color: #fff;
}

.upload-area-actions .el-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.quantity-test-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.quantity-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quantity-title {
  font-size: 14px;
  color: #0ac5a8;
  font-weight: bold;
}

.quantity-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quantity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 42, 56, 0.8);
  border-radius: 4px;
  padding: 8px;
  border: 1px solid rgba(10, 197, 168, 0.1);
  margin-bottom: 5px;

  .quantity-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    min-width: 30px;
  }

  .quantity-value {
    font-size: 14px;
    color: #0ac5a8;
    font-weight: bold;
    min-width: 30px;
    text-align: center;
  }

  .quantity-buttons {
    display: flex;
    gap: 5px;

    .quantity-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      background: rgba(10, 197, 168, 0.3);
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }

      &.plus {
        background: rgba(10, 197, 168, 0.5);
        &:hover {
          background: rgba(10, 197, 168, 0.7);
        }
      }

      &.minus {
        background: rgba(245, 108, 108, 0.3);
        &:hover {
          background: rgba(245, 108, 108, 0.5);
        }
      }
    }
  }
}

/* 添加新的测试面板样式 */
.task-test-container {
  margin-top: 10px;

  .task-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

/* 托盘检索弹窗样式 */
.tray-search-form {
  .search-result {
    margin-top: 20px;
  }

  .no-result {
    margin-top: 20px;

    .no-result-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 20px;
      background: rgba(30, 42, 56, 0.8);
      border-radius: 8px;
      border: 1px solid rgba(255, 193, 7, 0.3);

      i {
        font-size: 48px;
        color: #ffc107;
        margin-bottom: 15px;
      }

      p {
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        margin: 0;
        text-align: center;
      }
    }
  }
}

/* 队列信息标题操作按钮样式 */
.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;

  .arrow-icon {
    cursor: pointer;
    transition: all 0.3s ease;
    color: #0ac5a8;
    font-size: 16px;

    &:hover {
      color: #fff;
      transform: scale(1.1);
    }
  }
}
</style>
