import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  dialog,
  Tray,
  screen
} from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import nodes7 from 'nodes7';
import HttpUtil from '@/utils/HttpUtil';
import logger from 'electron-log';
// 设置日志文件的保存路径
logger.transports.file.file = app.getPath('userData') + '/app.log';

// 初始化日志记录器
logger.transports.file.level = 'info';
logger.transports.console.level = 'info';
// 日期样式
logger.transports.file.format =
  '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
console.log(app.getPath('userData'));
logger.transports.file.file = app.getPath('userData') + '/app.log';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
var appTray = null;
let closeStatus = false;
var conn = new nodes7();

// 记录日志的辅助函数
function logToFile(message) {
  const timestamp = new Date().toLocaleString();
  const logPath =
    'D://wcs_temp_data/log/' +
    new Date().toLocaleDateString().replaceAll('/', '-') +
    'runlog.txt';
  fs.appendFile(logPath, `[${timestamp}] ${message}\n`, (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

// 日志缓冲相关变量
let logBuffer = [];
let logBufferTimer = null;
const LOG_BUFFER_SIZE = 10; // 缓冲区大小
const LOG_FLUSH_INTERVAL = 5000; // 5秒刷新一次

// 优化的日志写入函数
function writeLogToLocalOptimized(logData) {
  // 添加时间戳
  const timestamp = new Date().toLocaleString();
  const logEntry = `[${timestamp}] ${logData}\n`;

  // 添加到缓冲区
  logBuffer.push(logEntry);

  // 如果缓冲区满了，立即刷新
  if (logBuffer.length >= LOG_BUFFER_SIZE) {
    flushLogBuffer();
  } else if (!logBufferTimer) {
    // 设置定时器，定期刷新缓冲区
    logBufferTimer = setTimeout(() => {
      flushLogBuffer();
    }, LOG_FLUSH_INTERVAL);
  }
}

// 刷新日志缓冲区
function flushLogBuffer() {
  if (logBuffer.length === 0) return;

  const logPath =
    'D://wcs_temp_data/log/' +
    (new Date().toLocaleDateString() + '.txt').replaceAll('/', '-');

  // 确保日志目录存在
  const logDir = 'D://wcs_temp_data/log';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 检查日志文件大小，如果超过10MB则进行轮转
  try {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      if (fileSizeInMB > 10) {
        // 创建备份文件
        const backupPath = logPath.replace('.txt', `_${Date.now()}.txt`);
        fs.renameSync(logPath, backupPath);
        console.log(`日志文件过大，已轮转到: ${backupPath}`);
      }
    }
  } catch (error) {
    console.error('检查日志文件大小时出错:', error);
  }

  // 批量写入日志
  const logContent = logBuffer.join('');
  fs.appendFile(logPath, logContent, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });

  // 清空缓冲区
  logBuffer = [];

  // 清除定时器
  if (logBufferTimer) {
    clearTimeout(logBufferTimer);
    logBufferTimer = null;
  }
}
// electron 开启热更新
try {
  require('electron-reloader')(module, {});
} catch (_) {
  // 忽略热更新错误
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出时确保所有日志都被写入
app.on('before-quit', () => {
  flushLogBuffer();
});

// 单实例锁，防止应用被多开 - 必须在app.ready之前检查
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  // 直接退出，不创建任何窗口，避免白色背景框
  console.log('检测到已有程序运行，直接退出');
  // 使用 process.exit 确保立即退出，避免任何延迟
  process.exit(0);
} else {
  app.on('second-instance', (event, argv, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

global.sharedObject = {
  userInfo: {}
};
let mainWindow = null;
app.on('ready', () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    },
    icon: './build/icons/icon.ico'
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html');
    // mainWindow.webContents.openDevTools();
  }
  ipcMain.on('logStatus', (event, arg) => {
    console.log(arg);
    if (arg === 'login') {
      mainWindow.setResizable(true);
      mainWindow.setBounds({
        x: 0,
        y: 0,
        width: screen.getPrimaryDisplay().workAreaSize.width,
        height: screen.getPrimaryDisplay().workAreaSize.height
      });
    } else {
      // 太几把坑了，windows系统setSize center方法失效 必须先mainWindow.unmaximize()
      mainWindow.unmaximize();
      mainWindow.setSize(1100, 600);
      mainWindow.center();
      global.sharedObject.userInfo = {};
      // mainWindow.setResizable(false)
    }
  });
  // 定义自定义事件
  ipcMain.on('close-window', function () {
    mainWindow.close();
  });
  // 定义自定义事件
  ipcMain.on('min-window', (event, arg) => {
    mainWindow.minimize();
  });
  // writeValuesToPLC
  ipcMain.on('writeValuesToPLC', (event, arg1, arg2) => {
    writeValuesToPLC(arg1, arg2);
  });
  // writeSingleValueToPLC - 单独给PLC某个变量写值，通过批量写入数组实现
  ipcMain.on('writeSingleValueToPLC', (event, arg1, arg2) => {
    writeSingleValueToPLC(arg1, arg2);
  });
  // cancelWriteToPLC - 取消PLC某个变量的写入
  ipcMain.on('cancelWriteToPLC', (event, arg1) => {
    cancelWriteToPLC(arg1);
  });
  // 定义自定义事件
  ipcMain.on('max-window', (event, arg) => {
    if (arg === 'max-window') {
      return mainWindow.maximize();
    }
    mainWindow.unmaximize();
    mainWindow.setBounds({
      x: 10,
      y: 10,
      width: screen.getPrimaryDisplay().workAreaSize.width - 20,
      height: screen.getPrimaryDisplay().workAreaSize.height - 20
    });
  });
  // 启动plc conPLC
  ipcMain.on('conPLC', (event, arg1, arg2) => {
    if (process.env.NODE_ENV === 'production') {
      conPLC();
    }
    // setInterval(() => {
    //   console.log(writeStrArr.toString());
    // }, 50);
    // sendHeartToPLC()
  });
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('mainWin-max', 'max-window');
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('mainWin-max', 'unmax-window');
  });
  mainWindow.on('close', (e) => {
    closeStatus = true;
    e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
    dialog
      .showMessageBox({
        type: 'warning',
        title: '提醒！',
        message: '确认关闭程序吗？',
        buttons: ['关闭程序', '放入托盘', '取消'], //选择按钮，点击确认则下面的idx为0，取消为1
        cancelId: 2 //这个的值是如果直接把提示框×掉返回的值，这里设置成和"取消"按钮一样的值，下面的idx也会是1
      })
      .then((idx) => {
        if (idx.response == 2) {
          e.preventDefault();
        } else if (idx.response == 0) {
          mainWindow = null;
          app.exit();
        } else {
          mainWindow.setSkipTaskbar(true);
          mainWindow.hide();
        }
      });
  });
  if (process.env.NODE_ENV === 'development') {
    let revert = false;
    setInterval(() => {
      if (mainWindow) {
        if (revert) {
          mainWindow.webContents.send(
            'receivedMsg',
            {
              DBW0: 0,
              DBW6: 0,
              DBW8: 35580,
              DBW10: 512,
              DBW12: -1793,
              DBW14: 0,
              DBW16: 0,
              DBW28: 0,
              DBW30: 0,
              DBW34: 0,
              DBW36: 0,
              DBW38: 0,
              DBW40: 0,
              DBW42: 0,
              DBW44: 0,
              DBW46: 0,
              DBW48: 0,
              DBW50: 0,
              DBW64: 0,
              DBW66: 0,
              DBW70: 0,
              DBW74: 0,
              DBW78: 0,
              DBW82: 0,
              DBW84: 0,
              DBW86: 0,
              DBW394: 0, // DBW394调试值：0
              DBB160: 'HF800SR-1-H                   ',
              DBB190: '83048880004868800784          ',
              DBB220: 'HF800SR-1-H                   ',
              DBB250: '83048880004868800784          ',
              DBB280: 'HF800SR-1-H                   '
            },
            writeStrArr.toString()
          );
        } else {
          mainWindow.webContents.send(
            'receivedMsg',
            {
              DBW0: 1,
              DBW6: 0,
              DBW8: 35580,
              DBW10: 512,
              DBW12: -1793,
              DBW14: 0,
              DBW16: 0,
              DBW28: 0,
              DBW30: 0,
              DBW34: 0,
              DBW36: 0,
              DBW38: 0,
              DBW40: 0,
              DBW42: 0,
              DBW44: 0,
              DBW46: 0,
              DBW48: 0,
              DBW50: 0,
              DBW64: 0,
              DBW66: 0,
              DBW70: 0,
              DBW74: 0,
              DBW78: 0,
              DBW82: 0,
              DBW84: 0,
              DBW86: 0,
              DBW394: 32, // DBW394调试值：0x0020 (32)
              DBB160: 'HF800SR-1-H                   ',
              DBB190: '83048880004868800784          ',
              DBB220: 'HF800SR-1-H                   ',
              DBB250: '83048880004868800784          ',
              DBB280: 'HF800SR-1-H                   '
            },
            writeStrArr.toString()
          );
        }
        revert = !revert;
      }
    }, 500);
  }
  setAppTray();
  if (process.env.NODE_ENV === 'production') {
    try {
      const javaPath = path.join(
        __static,
        './jre',
        'jre1.8.0_251',
        'bin',
        'java'
      );
      const jarPath = path.join(
        __static,
        './jarlib',
        'ccs-disinfection-changzhou-middle.jar'
      );

      // 优化的Java启动参数
      const javaOpts = [
        // 内存设置
        '-Xmx4096m', // 最大堆内存
        '-Xms4096m', // 初始堆内存
        '-XX:MaxMetaspaceSize=512m', // 最大元空间大小
        '-XX:MetaspaceSize=256m', // 初始元空间大小

        // GC设置
        '-XX:+UseG1GC', // 使用G1垃圾收集器
        '-XX:MaxGCPauseMillis=200', // 最大GC停顿时间
        '-XX:+HeapDumpOnOutOfMemoryError', // 内存溢出时导出堆转储
        '-XX:HeapDumpPath=D://wcs_temp_data/dump', // 堆转储文件路径

        // 性能优化
        '-XX:+DisableExplicitGC', // 禁止显式GC调用
        '-XX:+UseStringDeduplication', // 开启字符串去重
        '-XX:+OptimizeStringConcat', // 优化字符串连接

        // 监控和调试
        '-XX:+PrintGCDetails', // 打印GC详细信息
        '-XX:+PrintGCDateStamps', // 打印GC时间戳
        '-Xloggc:D://wcs_temp_data/log/gc.log', // GC日志文件
        '-XX:+HeapDumpBeforeFullGC', // Full GC前生成堆转储
        '-XX:+PrintGCApplicationStoppedTime', // 打印应用暂停时间

        // 错误处理
        '-XX:+ExitOnOutOfMemoryError', // 发生OOM时退出
        '-XX:ErrorFile=D://wcs_temp_data/log/hs_err_%p.log', // JVM错误日志
        // 编码
        '-Dfile.encoding=UTF-8',
        // 应用参数
        '-jar',
        jarPath
      ];
      // 确保日志目录存在
      const logDir = 'D://wcs_temp_data/log';
      const dumpDir = 'D://wcs_temp_data/dump';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      if (!fs.existsSync(dumpDir)) {
        fs.mkdirSync(dumpDir, { recursive: true });
      }

      logToFile(`启动Java进程，使用参数: ${javaOpts.join(' ')}`);
      const process = spawn(javaPath, javaOpts);

      process.on('error', (err) => {
        logToFile(`Java程序启动错误: ${err.message}`);
      });

      process.on('exit', (code, signal) => {
        logToFile(`Java程序退出，退出码: ${code}, 信号: ${signal}`);
      });
    } catch (error) {
      logToFile(`Java程序启动异常: ${error.message}`);
    }
  }

  // 开发者工具
  globalShortcut.register('CommandOrControl+L', () => {
    mainWindow.webContents.openDevTools();
  });
  globalShortcut.register('CommandOrControl+F11', () => {
    mainWindow.isFullScreen()
      ? mainWindow.setFullScreen(false)
      : mainWindow.setFullScreen(true);
  });
  // 定义自定义事件
  ipcMain.on('full_screen', function () {
    mainWindow.isFullScreen()
      ? mainWindow.setFullScreen(false)
      : mainWindow.setFullScreen(true);
  });
  // 定义自定义事件 - 优化后的日志写入
  ipcMain.on('writeLogToLocal', (event, arg) => {
    writeLogToLocalOptimized(arg);
  });
});

function conPLC() {
  logger.info('开始连接PLC');
  // 查询配置
  HttpUtil.get('/cssConfig/getConfig')
    .then((res) => {
      logger.info(JSON.stringify(res));
      if (!res.data.plcPort) {
        logger.info('配置查询失败');
        // We have an error. Maybe the PLC is not reachable.
        conPLC();
        return false;
      }
      conn.initiateConnection(
        {
          port: Number(res.data.plcPort),
          host: res.data.plcIp,
          rack: 0,
          slot: 1,
          debug: false
        },
        (err) => {
          if (typeof err !== 'undefined') {
            logger.info('连接PLC失败' + JSON.stringify(err));
            // We have an error. Maybe the PLC is not reachable.
            conPLC();
            return false;
            // process.exit();
          }
          conn.setTranslationCB(function (tag) {
            return variables[tag];
          }); // This sets the "translation" to allow us to work with object names
          logger.info('连接PLC成功');
          // 输送线看门狗心跳
          conn.addItems('DBW0');
          // 输送线当前运行状态
          conn.addItems('DBW2');
          // 允许进料反馈
          conn.addItems('DBW4');
          // A线电机运行信号
          conn.addItems('DBW6');
          // A线光电检测信号
          conn.addItems('DBW8');
          // B线电机运行信号
          conn.addItems('DBW10');
          // B线光电检测信号
          conn.addItems('DBW12');
          // C线电机运行信号
          conn.addItems('DBW14');
          // C线光电检测信号
          conn.addItems('DBW16');
          // D线电机运行信号
          conn.addItems('DBW18');
          // D线光电检测信号
          conn.addItems('DBW20');
          // E线电机运行信号
          conn.addItems('DBW22');
          // E线光电检测信号
          conn.addItems('DBW24');
          // 输送线故障反馈
          conn.addItems('DBW26');
          // 缓存区数量
          conn.addItems('DBW28');
          // 请求上位机下发任务(判断去灭菌还是非灭菌）
          conn.addItems('DBW30');
          // 非灭菌缓存区数量
          conn.addItems('DBW32');
          // A1数量
          conn.addItems('DBW34');
          // A2数量
          conn.addItems('DBW36');
          // A3数量
          conn.addItems('DBW38');
          // B1数量
          conn.addItems('DBW40');
          // B2数量
          conn.addItems('DBW42');
          // B3数量
          conn.addItems('DBW44');
          // C1数量
          conn.addItems('DBW46');
          // C2数量
          conn.addItems('DBW48');
          // C3数量
          conn.addItems('DBW50');
          // D进货数量
          conn.addItems('DBW52');
          // D出货数量
          conn.addItems('DBW54');
          // D请求出货信号
          conn.addItems('DBW56');
          // E进货数量
          conn.addItems('DBW58');
          // E出货数量
          conn.addItems('DBW60');
          // E请求出货信号
          conn.addItems('DBW62');
          // E数量
          conn.addItems('DBW58');
          // 上货区电机运行信号（扫码后入队）
          conn.addItems('DBW64');
          // 上货区输送线光电信号
          conn.addItems('DBW66');
          // 预热前小车电机运行信号1#车
          conn.addItems('DBW68');
          // 预热前小车检测信号1#车
          conn.addItems('DBW70');
          // 灭菌前小车电机运行信号2#车
          conn.addItems('DBW72');
          // 灭菌前小车检测信号2#车
          conn.addItems('DBW74');
          // 解析前小车电机运行信号3#车
          conn.addItems('DBW76');
          // 解析前小车检测信号3#车
          conn.addItems('DBW78');
          // 解析后小车电机运行信号4#车
          conn.addItems('DBW80');
          // 解析后小车检测信号4#车
          conn.addItems('DBW82');
          // 扫码枪处光电信号
          conn.addItems('DBW84');
          // 请求上位机下发任务(预热小车前）
          conn.addItems('DBW86');
          // 预热前1#小车位置值
          conn.addItems('DBW88');
          // 灭菌前2#小车位置值
          conn.addItems('DBW90');
          // 解析出4#小车位置值
          conn.addItems('DBW92');
          // 灭菌前2#小车位置值
          conn.addItems('DBW94');
          // 提升机一楼接货站台扫码数据（托盘号）
          conn.addItems('DBB160');
          // 一楼顶升移栽区扫码数据（扫码后判断方向）（托盘号）
          conn.addItems('DBB190');
          // 提升机二楼接货站台扫码数据（托盘号）
          conn.addItems('DBB220');
          // 提升机三楼接货站台扫码数据（托盘号）
          conn.addItems('DBB250');
          // 提升机四楼接货站台扫码数据（托盘号）
          conn.addItems('DBB280');
          // D扫码
          conn.addItems('DBB310');
          //E扫码
          conn.addItems('DBB340');
          // 报警点位读取
          conn.addItems('DBW370'); // 提升机相关报警
          conn.addItems('DBW372'); // 提升机相关报警
          conn.addItems('DBW374'); // 门安全故障相关报警
          conn.addItems('DBW376'); // 备用报警点位
          conn.addItems('DBW378'); // 链条电机相关报警
          conn.addItems('DBW380'); // 链条电机相关报警
          conn.addItems('DBW382'); // 链条电机相关报警
          conn.addItems('DBW384'); // 预热进口小车相关报警
          conn.addItems('DBW386'); // 预热进口小车相关报警
          conn.addItems('DBW388'); // A1-1预热相关报警
          conn.addItems('DBW390'); // B1-1预热相关报警
          conn.addItems('DBW392'); // C1-1预热相关报警
          conn.addItems('DBW394'); // 预热出小车相关报警
          conn.addItems('DBW396'); // 预热出小车相关报警
          conn.addItems('DBW398'); // A2-1灭菌相关报警
          conn.addItems('DBW400'); // B2-1灭菌相关报警
          conn.addItems('DBW402'); // C2-1灭菌相关报警
          conn.addItems('DBW404'); // 解析进小车相关报警
          conn.addItems('DBW406'); // 解析进小车相关报警
          conn.addItems('DBW408'); // A3-1解析相关报警
          conn.addItems('DBW410'); // B3-1解析相关报警
          conn.addItems('DBW412'); // C3-1解析相关报警
          conn.addItems('DBW414'); // 解析出小车相关报警
          conn.addItems('DBW416'); // 解析出小车相关报警
          conn.addItems('DBW418'); // 立库对接相关报警
          conn.addItems('DBW420'); // D柜相关报警
          conn.addItems('DBW422'); // E柜相关报警
          conn.addItems('DBW424'); // 上货1数量
          conn.addItems('DBW426'); // 上货2数量
          conn.addItems('DBW428'); // 缓存区1数量
          conn.addItems('DBW430'); // 缓存区2数量
          conn.addItems('DBW432'); // 预热、灭菌、解析柜状态
          setInterval(() => {
            conn.readAllItems(valuesReady);
          }, 200);
          setInterval(() => {
            // nodes7 代码
            conn.writeItems(writeAddArr, writeStrArr, valuesWritten);
          }, 200);
          // 发送心跳
          sendHeartToPLC();
        }
      );
    })
    .catch((err) => {
      logger.info('config error!');
    });
}
let times = 1;
let nowValue = 0;
function sendHeartToPLC() {
  setInterval(() => {
    if (times > 5) {
      times = 1;
      nowValue = 1 - nowValue;
    }
    times++;
    writeValuesToPLC('DBW500', nowValue);
  }, 200); // 每200毫秒执行一次交替
}

var variables = {
  DBW0: 'DB101,INT0', // 心跳
  DBW2: 'DB101,INT2', // 输送线当前运行状态
  DBW4: 'DB101,INT4', // 允许进料反馈
  DBW6: 'DB101,INT6', // A线电机运行信号
  DBW8: 'DB101,INT8', // A线光电检测信号
  DBW10: 'DB101,INT10', // B线电机运行信号
  DBW12: 'DB101,INT12', // B线光电检测信号
  DBW14: 'DB101,INT14', // C线电机运行信号
  DBW16: 'DB101,INT16', // C线光电检测信号
  DBW18: 'DB101,INT18', // D线电机运行信号
  DBW20: 'DB101,INT20', // D线光电检测信号
  DBW22: 'DB101,INT22', // E线电机运行信号
  DBW24: 'DB101,INT24', // E线光电检测信号
  DBW26: 'DB101,INT26', // 输送线故障反馈
  DBW28: 'DB101,INT28', // 缓存区数量
  DBW30: 'DB101,INT30', // 请求上位机下发任务(判断去灭菌还是非灭菌）
  DBW32: 'DB101,INT32', // 非灭菌缓存区数量
  DBW34: 'DB101,INT34', // A1数量
  DBW36: 'DB101,INT36', // A2数量
  DBW38: 'DB101,INT38', // A3数量
  DBW40: 'DB101,INT40', // B1数量
  DBW42: 'DB101,INT42', // B2数量
  DBW44: 'DB101,INT44', // B3数量
  DBW46: 'DB101,INT46', // C1数量
  DBW48: 'DB101,INT48', // C2数量
  DBW50: 'DB101,INT50', // C3数量
  DBW52: 'DB101,INT52', // D进货数量
  DBW54: 'DB101,INT54', // D出货数量
  DBW56: 'DB101,INT56', // D请求出货信号
  DBW58: 'DB101,INT58', // E进货数量
  DBW60: 'DB101,INT60', // E出货数量
  DBW62: 'DB101,INT62', // E请求出货信号
  DBW64: 'DB101,INT64', // 上货区电机运行信号（扫码后入队）
  DBW66: 'DB101,INT66', // 上货区输送线光电信号
  DBW68: 'DB101,INT68', // 预热前小车电机运行信号1#车
  DBW70: 'DB101,INT70', // 预热前小车检测信号1#车
  DBW72: 'DB101,INT72', // 灭菌前小车电机运行信号2#车
  DBW74: 'DB101,INT74', // 灭菌前小车检测信号2#车
  DBW76: 'DB101,INT76', // 解析前小车电机运行信号3#车
  DBW78: 'DB101,INT78', // 解析前小车检测信号3#车
  DBW80: 'DB101,INT80', // 解析后小车电机运行信号4#车
  DBW82: 'DB101,INT82', // 解析后小车检测信号4#车
  DBW84: 'DB101,INT84', // 扫码枪处光电信号
  DBW86: 'DB101,INT86', // 请求上位机下发任务(预热小车前）
  DBW88: 'DB101,INT88', // 预热前1#小车位置值
  DBW90: 'DB101,INT90', // 灭菌前2#小车位置值
  DBW92: 'DB101,INT92', // 解析出4#小车位置值
  DBW94: 'DB101,INT94', // 灭菌前2#小车位置值
  DBB160: 'DB101,C160.30', // 提升机一楼接货站台扫码数据（托盘号）
  DBB190: 'DB101,C190.30', // 一楼顶升移栽区扫码数据（扫码后判断方向）（托盘号）
  DBB220: 'DB101,C220.30', // 提升机二楼接货站台扫码数据（托盘号）
  DBB250: 'DB101,C250.30', // 提升机三楼接货站台扫码数据（托盘号）
  DBB280: 'DB101,C280.30', // 提升机四楼接货站台扫码数据（托盘号）
  DBB310: 'DB101,C310.30', // D扫码
  DBB340: 'DB101,C340.30', // E扫码
  DBW500: 'DB101,INT500', // WCS看门狗心跳
  DBW502: 'DB101,INT502', // WCS-全线启动
  DBW504: 'DB101,INT504', // WCS-全线停止
  DBW506: 'DB101,INT506', // WCS看门狗心跳
  DBW508: 'DB101,INT508', // WCS-故障复位
  DBW510: 'DB101,INT510', // 接货口全部禁用→写1禁用；写0不禁用
  DBW512: 'DB101,INT512', // 一楼接货口启用→写1启用；写0不启用
  DBW514: 'DB101,INT514', // 二楼接货口启用→写1启用；写0不启用
  DBW516: 'DB101,INT516', // 三楼接货口启用→写1启用；写0不启用
  DBW518: 'DB101,INT518', // 四楼接货口启用→写1启用；写0不启用
  DBW520: 'DB101,INT520', // 一楼D灭菌接货口启用→写1启用；写0不启用
  DBW522: 'DB101,INT522', // 一楼E灭菌接货口启用→写1启用；写0不启用
  DBW524: 'DB101,INT524', // WCS执行进货预热房编号预热房
  DBW526: 'DB101,INT526', // WCS执行出货预热房编号
  DBW528: 'DB101,INT528', // WCS执行进货灭菌柜编号
  DBW530: 'DB101,INT530', // WCS执行出货灭菌柜编号
  DBW532: 'DB101,INT532', // WCS执行进货解析柜编号
  DBW534: 'DB101,INT534', // WCS执行出货解析柜编号
  DBW536: 'DB101,INT536', // WCS执行出货DE灭菌柜编号
  DBW540: 'DB101,INT540', // WCS下发任务完成
  DBW542: 'DB101,INT542', // WCS下发顶升移栽目的地
  // DBW544: 'DB101,INT544', // WCS-接货口进货错误 - 改为位级别控制
  DBW544_BIT0: 'DB101,X544.0', // WCS-接货口进货错误 - 位0 (第544字节，位0)
  DBW544_BIT1: 'DB101,X544.1', // WCS-接货口进货错误 - 位1 (第544字节，位1)
  DBW544_BIT2: 'DB101,X544.2', // WCS-接货口进货错误 - 位2 (第544字节，位2)
  DBW544_BIT3: 'DB101,X544.3', // WCS-接货口进货错误 - 位3 (第544字节，位3)
  DBW544_BIT4: 'DB101,X544.4', // WCS-接货口进货错误 - 位4 (第544字节，位4)
  DBW544_BIT5: 'DB101,X544.5', // WCS-接货口进货错误 - 位5 (第544字节，位5)
  DBW544_BIT6: 'DB101,X544.6', // WCS-接货口进货错误 - 位6 (第544字节，位6)
  DBW544_BIT7: 'DB101,X544.7', // WCS-接货口进货错误 - 位7 (第544字节，位7)
  DBW544_BIT8: 'DB101,X545.0', // WCS-接货口进货错误 - 位8 (第545字节，位0)
  DBW544_BIT9: 'DB101,X545.1', // WCS-接货口进货错误 - 位9 (第545字节，位1)
  DBW544_BIT10: 'DB101,X545.2', // WCS-接货口进货错误 - 位10 (第545字节，位2)
  DBW544_BIT11: 'DB101,X545.3', // WCS-接货口进货错误 - 位11 (第545字节，位3)
  DBW544_BIT12: 'DB101,X545.4', // WCS-接货口进货错误 - 位12 (第545字节，位4)
  DBW544_BIT13: 'DB101,X545.5', // WCS-接货口进货错误 - 位13 (第545字节，位5)
  DBW544_BIT14: 'DB101,X545.6', // WCS-接货口进货错误 - 位14 (第545字节，位6)
  DBW546: 'DB101,INT546', // WCS-预热柜当前需要进货数量
  DBW548: 'DB101,INT548', // WCS-灭菌柜当前需要进货数量
  DBW550: 'DB101,INT550', // WCS-解析柜当前需要进货数量
  DBW552: 'DB101,INT552', // WCS-D灭菌柜当前需要进货数量
  DBW554: 'DB101,INT554', // WCS-E灭菌柜当前需要进货数量
  DBW556: 'DB101,INT556', // 备用地址
  DBW558: 'DB101,INT558', // WCS-预热前小车信号请求尾托盘标识
  DBW560: 'DB101,INT560', // 出库当前需进货数量
  DBW562: 'DB101,INT562', // 无码上货模式
  DBW564: 'DB101,INT564', // 入库1线
  DBW566: 'DB101,INT566', // 入库2线
  DBW568: 'DB101,INT568', // 缓存1#线
  DBW570: 'DB101,INT570', // 缓存2#线
  DBW572_BIT0: 'DB101,X572.0', // 控制按钮
  DBW572_BIT1: 'DB101,X572.1', // 控制按钮
  DBW572_BIT2: 'DB101,X572.2', // 控制按钮
  DBW572_BIT3: 'DB101,X572.3', // 控制按钮
  DBW572_BIT4: 'DB101,X572.4', // 控制按钮
  DBW572_BIT5: 'DB101,X572.5', // 控制按钮
  DBW574: 'DB101,INT574', // 缓存数量
  // A线
  DBW576: 'DB101,INT576', // A1预热1线数量
  DBW578: 'DB101,INT578', // A1预热2线数量
  DBW580: 'DB101,INT580', // A2灭菌1线数量
  DBW582: 'DB101,INT582', // A2灭菌2线数量
  DBW584: 'DB101,INT584', // A3解析1线数量
  DBW586: 'DB101,INT586', // A3解析2线数量
  DBW588_BIT0: 'DB101,X588.0', // A1预热1线写入
  DBW588_BIT1: 'DB101,X588.1', // A1预热2线写入
  DBW588_BIT2: 'DB101,X588.2', // A2灭菌1线写入
  DBW588_BIT3: 'DB101,X588.3', // A2灭菌2线写入
  DBW588_BIT4: 'DB101,X588.4', // A3解析1线写入
  DBW588_BIT5: 'DB101,X588.5', // A3解析2线写入
  // B线
  DBW590: 'DB101,INT590', // B1预热1线数量
  DBW592: 'DB101,INT592', // B1预热2线数量
  DBW594: 'DB101,INT594', // B2灭菌1线数量
  DBW596: 'DB101,INT596', // B2灭菌2线数量
  DBW598: 'DB101,INT598', // B3解析1线数量
  DBW600: 'DB101,INT600', // B3解析2线数量
  DBW602_BIT0: 'DB101,X602.0', // B1预热1线写入
  DBW602_BIT1: 'DB101,X602.1', // B1预热2线写入
  DBW602_BIT2: 'DB101,X602.2', // B2灭菌1线写入
  DBW602_BIT3: 'DB101,X602.3', // B2灭菌2线写入
  DBW602_BIT4: 'DB101,X602.4', // B3解析1线写入
  DBW602_BIT5: 'DB101,X602.5', // B3解析2线写入
  // C线
  DBW604: 'DB101,INT604', // C1预热1线数量
  DBW606: 'DB101,INT606', // C1预热2线数量
  DBW608: 'DB101,INT608', // C2灭菌1线数量
  DBW610: 'DB101,INT610', // C2灭菌2线数量
  DBW612: 'DB101,INT612', // C3解析1线数量
  DBW614: 'DB101,INT614', // C3解析2线数量
  DBW616_BIT0: 'DB101,X616.0', // C1预热1线写入
  DBW616_BIT1: 'DB101,X616.1', // C1预热2线写入
  DBW616_BIT2: 'DB101,X616.2', // C2灭菌1线写入
  DBW616_BIT3: 'DB101,X616.3', // C2灭菌2线写入
  DBW616_BIT4: 'DB101,X616.4', // C3解析1线写入
  DBW616_BIT5: 'DB101,X616.5', // C3解析2线写入
  // D\E线
  DBW618: 'DB101,INT618', // D线灭菌进数量
  DBW620: 'DB101,INT620', // D线灭菌出数量
  DBW622: 'DB101,INT622', // E线灭菌进数量
  DBW624: 'DB101,INT624', // E线灭菌出数量
  DBW626_BIT0: 'DB101,X626.0', // D线灭菌进写入
  DBW626_BIT1: 'DB101,X626.1', // D线灭菌出写入
  DBW626_BIT2: 'DB101,X626.2', // E线灭菌进写入
  DBW626_BIT3: 'DB101,X626.3', // E线灭菌出写入
  // 报警点位映射
  DBW370: 'DB101,INT370', // 提升机相关报警
  DBW372: 'DB101,INT372', // 提升机相关报警
  DBW374: 'DB101,INT374', // 门安全故障相关报警
  DBW376: 'DB101,INT376', // 备用报警点位
  DBW378: 'DB101,INT378', // 链条电机相关报警
  DBW380: 'DB101,INT380', // 链条电机相关报警
  DBW382: 'DB101,INT382', // 链条电机相关报警
  DBW384: 'DB101,INT384', // 预热进口小车相关报警
  DBW386: 'DB101,INT386', // 预热进口小车相关报警
  DBW388: 'DB101,INT388', // A1-1预热相关报警
  DBW390: 'DB101,INT390', // B1-1预热相关报警
  DBW392: 'DB101,INT392', // C1-1预热相关报警
  DBW394: 'DB101,INT394', // 预热出小车相关报警
  DBW396: 'DB101,INT396', // 预热出小车相关报警
  DBW398: 'DB101,INT398', // A2-1灭菌相关报警
  DBW400: 'DB101,INT400', // B2-1灭菌相关报警
  DBW402: 'DB101,INT402', // C2-1灭菌相关报警
  DBW404: 'DB101,INT404', // 解析进小车相关报警
  DBW406: 'DB101,INT406', // 解析进小车相关报警
  DBW408: 'DB101,INT408', // A3-1解析相关报警
  DBW410: 'DB101,INT410', // B3-1解析相关报警
  DBW412: 'DB101,INT412', // C3-1解析相关报警
  DBW414: 'DB101,INT414', // 解析出小车相关报警
  DBW416: 'DB101,INT416', // 解析出小车相关报警
  DBW418: 'DB101,INT418', // 立库对接相关报警
  DBW420: 'DB101,INT420', // D柜相关报警
  DBW422: 'DB101,INT422', // E柜相关报警
  DBW424: 'DB101,INT424', // 上货1数量
  DBW426: 'DB101,INT426', // 上货2数量
  DBW428: 'DB101,INT428', // 缓存区1数量
  DBW430: 'DB101,INT430', // 缓存区2数量
  DBW432: 'DB101,INT432' // 预热、灭菌、解析柜状态
};

var writeStrArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
var writeAddArr = [
  'DBW500',
  'DBW502',
  'DBW504',
  'DBW506',
  'DBW508',
  'DBW510',
  'DBW512',
  'DBW514',
  'DBW516',
  'DBW518',
  'DBW520',
  'DBW522',
  // 'DBW524',
  // 'DBW526',
  // 'DBW528',
  // 'DBW530',
  // 'DBW532',
  // 'DBW534',
  // 'DBW536',
  'DBW540',
  // 'DBW542',
  // 'DBW544', // 已改为位级别控制，不再批量写入
  'DBW546',
  'DBW548',
  'DBW550',
  'DBW552',
  'DBW554',
  'DBW562'
];

// 给PLC写值
function writeValuesToPLC(add, values) {
  const index = writeAddArr.indexOf(add);
  if (index !== -1) {
    writeStrArr[index] = values;
  } else {
    console.warn(`Address ${add} not found in writeAddArr.`);
  }
}

// 单独给PLC某个变量写值，通过操作批量写入数组实现，避免写入冲突
function writeSingleValueToPLC(add, values) {
  if (!variables[add]) {
    console.warn(`Address ${add} not found in variables.`);
    return;
  }

  // 查找地址在批量写入数组中的索引
  const index = writeAddArr.indexOf(add);

  if (index !== -1) {
    // 地址已存在，直接更新值（这个操作是原子的）
    writeStrArr[index] = values;
    console.log(`更新PLC地址 ${add} 的值为：${values}`);
  } else {
    // 地址不存在，使用原子性操作添加到批量写入数组
    const newAddArr = [...writeAddArr, add];
    const newStrArr = [...writeStrArr, values];

    // 原子性替换数组内容
    writeAddArr.length = 0;
    writeStrArr.length = 0;
    writeAddArr.push(...newAddArr);
    writeStrArr.push(...newStrArr);

    console.log(`添加PLC地址 ${add} 到批量写入数组，值：${values}`);
  }
}

// 取消PLC某个变量的写入，从批量写入数组中移除
function cancelWriteToPLC(add) {
  // 使用 filter 方法重建数组，避免 splice 的并发问题
  const originalLength = writeAddArr.length;
  const newAddArr = [];
  const newStrArr = [];

  for (let i = 0; i < writeAddArr.length; i++) {
    if (writeAddArr[i] !== add) {
      newAddArr.push(writeAddArr[i]);
      newStrArr.push(writeStrArr[i]);
    }
  }

  // 检查是否找到并移除了地址
  if (newAddArr.length === originalLength) {
    console.warn(`Address ${add} not found in writeAddArr, cannot cancel.`);
    return false;
  }

  // 原子性替换数组内容
  writeAddArr.length = 0;
  writeStrArr.length = 0;
  writeAddArr.push(...newAddArr);
  writeStrArr.push(...newStrArr);

  console.log(`已从批量写入数组中移除PLC地址：${add}`);

  // 验证数组长度一致性
  if (writeAddArr.length !== writeStrArr.length) {
    console.error(
      `数组长度不一致！地址数组长度：${writeAddArr.length}，值数组长度：${writeStrArr.length}`
    );
  }

  return true;
}

function valuesWritten(anythingBad) {
  if (anythingBad) {
    console.log('SOMETHING WENT WRONG WRITING VALUES!!!!');
  }
}

function valuesReady(anythingBad, values) {
  if (anythingBad) {
    console.log('SOMETHING WENT WRONG READING VALUES!!!!');
  }
  // console.log(values)
  mainWindow.webContents.send('receivedMsg', values, writeStrArr.toString());
}

const setAppTray = () => {
  // 系统托盘右键菜单
  var trayMenuTemplate = [
    {
      label: '退出',
      click: function () {
        app.quit();
      }
    }
  ];

  // 系统托盘图标目录
  appTray = new Tray(path.join(__static, './icon.ico'));

  // 图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  // 设置此托盘图标的悬停提示内容
  appTray.setToolTip('WCS系统');

  // 设置此图标的上下文菜单
  appTray.setContextMenu(contextMenu);

  appTray.on('click', function () {
    //主窗口显示隐藏切换
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    } else {
      mainWindow.show();
      mainWindow.setSkipTaskbar(false);
    }
  });
};
