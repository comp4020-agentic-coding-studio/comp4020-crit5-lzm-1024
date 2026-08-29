import type { PickupType, UpgradeChoice } from "../game/types.ts";

export type Language = "en" | "zh-CN" | "ja" | "ko" | "es";
type UpgradeId = UpgradeChoice["id"];

interface UpgradeCopy { name: string; description: string }

export interface LocaleStrings {
  languageName: string;
  soundOn: string; soundOff: string; controls: string; ultimateControl: string;
  menu: { start: string; howToPlay: string; settings: string; back: string; howTitle: string; pickupsTitle: string; move: string; fire: string; ultimate: string; settingsTitle: string; sound: string; language: string; languageHint: string; quality: string; high: string; balanced: string; performance: string; antialiasing: string; on: string; off: string; fps: string; screenShake: string; effects: string; full: string; reduced: string; fullscreen: string; exitFullscreen: string };
  opening: { combatSystem: string; weapon: string; shield: string; navigation: string; ready: string; mission: string; start: string; hint: string };
  hud: { hull: string; shield: string; score: string; combo: string; altitude: string; wave: string; phase: string; ultimate: string; ultimateReady: string; activate: string };
  upgrade: { choose: string; paused: string; level: string; online: string };
  level: { level: string; complete: string; incoming: string; objective: string; objectives: Record<"destroy" | "survive" | "escort" | "hunt" | "chase" | "escape" | "protect" | "breakthrough" | "boss" | "boss-rush", string> };
  rarity: Record<"COMMON" | "RARE" | "EPIC" | "LEGENDARY", string>;
  messages: { mission: string; boss: string; climax: string; phase2: string; phase3: string; finalStrike: string; ultimate: string };
  gameOver: { complete: string; neutralised: string; gameOver: string; signalLost: string; score: string; best: string; destroyed: string; maxCombo: string; survival: string; retry: string; menu: string };
  pickups: Record<"weapon" | "shield" | "repair" | "bomb" | "magnet" | "energy", string>;
  pickupRules: Record<PickupType, string>;
  upgrades: Record<UpgradeId, UpgradeCopy>;
}

export const SUPPORTED_LANGUAGES: Language[] = ["en", "zh-CN", "ja", "ko", "es"];

export const TRANSLATIONS: Record<Language, LocaleStrings> = {
  en: {
    languageName: "English", soundOn: "SOUND ON", soundOff: "SOUND OFF", controls: "MOVE · DODGE · AUTO FIRE", ultimateControl: "SPACE — ULTIMATE",
    menu: { start: "START GAME", howToPlay: "HOW TO PLAY", settings: "SETTINGS", back: "BACK", howTitle: "HOW TO PLAY", pickupsTitle: "PICKUPS", move: "Move with the mouse, touch, or arrow keys.", fire: "Weapons fire automatically. Move to aim.", ultimate: "Use SPACE or the lightning button at full energy.", settingsTitle: "SETTINGS", sound: "BACKGROUND MUSIC", language: "LANGUAGE", languageHint: "Click the language row to switch.", quality: "GRAPHICS QUALITY", high: "HIGH", balanced: "BALANCED", performance: "PERFORMANCE", antialiasing: "ANTI-ALIASING", on: "ON", off: "OFF", fps: "FRAME RATE", screenShake: "SCREEN SHAKE", effects: "MOTION EFFECTS", full: "FULL", reduced: "REDUCED", fullscreen: "FULLSCREEN", exitFullscreen: "EXIT FULLSCREEN" },
    opening: { combatSystem: "COMBAT FLIGHT SYSTEM", weapon: "WEAPON SYSTEM", shield: "SHIELD", navigation: "NAVIGATION", ready: "READY", mission: "MISSION 01", start: "START", hint: "MOVE  ·  DODGE  ·  AUTO FIRE" },
    hud: { hull: "HULL", shield: "SHIELD", score: "SCORE", combo: "COMBO", altitude: "ALT", wave: "WAVE", phase: "PHASE", ultimate: "ULTIMATE", ultimateReady: "ULTIMATE READY", activate: "SPACE  /  TAP" },
    upgrade: { choose: "CHOOSE AN UPGRADE", paused: "SYSTEM PAUSED", level: "LV.", online: "ONLINE" },
    level: { level: "LEVEL", complete: "LEVEL COMPLETE", incoming: "NEW COMBAT ZONE", objective: "OBJECTIVE", objectives: { destroy: "DESTROY HOSTILES", survive: "SURVIVE", escort: "ESCORT", hunt: "HUNT PRIORITY TARGET", chase: "CHASE", escape: "ESCAPE", protect: "PROTECT", breakthrough: "BREAK THROUGH", boss: "BOSS BATTLE", "boss-rush": "BOSS RUSH" } },
    rarity: { COMMON: "COMMON", RARE: "RARE", EPIC: "EPIC", LEGENDARY: "LEGENDARY" },
    messages: { mission: "MISSION 01  //  SKYFALL", boss: "WARNING  //  TITAN-01", climax: "WARNING  //  HEAVY CONTACT", phase2: "ARMOUR FAILURE  //  PHASE 02", phase3: "WARNING  //  CORE OVERLOAD", finalStrike: "FINAL STRIKE  //  CORE EXPOSED", ultimate: "TEMPORAL OVERDRIVE" },
    gameOver: { complete: "MISSION COMPLETE", neutralised: "TITAN-01 NEUTRALISED", gameOver: "GAME OVER", signalLost: "SIGNAL LOST", score: "SCORE", best: "BEST SCORE", destroyed: "ENEMIES DESTROYED", maxCombo: "MAX COMBO", survival: "SURVIVAL TIME", retry: "RETRY", menu: "MAIN MENU" },
    pickups: { weapon: "WEAPON", shield: "SHIELD", repair: "REPAIR", bomb: "BOMB", magnet: "MAGNET", energy: "ENERGY" },
    pickupRules: { weapon: "Weapon level +1", shield: "Restore 30 shield", repair: "Restore 28 hull", bomb: "Clear normal enemies and enemy bullets", magnet: "Pickup range +35", energy: "Restore 24 ultimate energy" },
    upgrades: {
      twin: { name: "TWIN CANNON", description: "Deploy two synchronized wing guns." }, rapid: { name: "RAPID FIRE", description: "Fire cycle accelerates by 25%." }, plasma: { name: "PLASMA", description: "Rounds pierce through one target." }, drone: { name: "STRIKE DRONE", description: "Add autonomous flank support." }, shield: { name: "AEGIS SHIELD", description: "Increase and restore shielding." }, critical: { name: "CRITICAL CORE", description: "Gain a chance to deal double damage." }, missile: { name: "SEEKER", description: "Launch periodic homing warheads." }, laser: { name: "ION LANCE", description: "Emit a periodic focused beam." }, magnet: { name: "GRAVITY WELL", description: "Pull rewards from farther away." }, repair: { name: "FIELD REPAIR", description: "Restore hull integrity immediately." },
    },
  },
  "zh-CN": {
    languageName: "简体中文", soundOn: "声音 开", soundOff: "声音 关", controls: "移动 · 闪避 · 自动射击", ultimateControl: "空格 — 终极技能",
    menu: { start: "开始游戏", howToPlay: "玩法说明", settings: "设置", back: "返回", howTitle: "玩法说明", pickupsTitle: "道具规则", move: "使用鼠标、触摸或方向键移动飞机。", fire: "武器会自动射击，移动飞机进行瞄准。", ultimate: "能量蓄满后按空格或点击闪电按钮。", settingsTitle: "设置", sound: "背景音乐", language: "语言", languageHint: "点击语言一栏即可切换。", quality: "画质", high: "高", balanced: "均衡", performance: "性能优先", antialiasing: "抗锯齿", on: "开", off: "关", fps: "帧率上限", screenShake: "屏幕震动", effects: "动态效果", full: "完整", reduced: "精简", fullscreen: "全屏", exitFullscreen: "退出全屏" },
    opening: { combatSystem: "空战系统", weapon: "武器系统", shield: "护盾", navigation: "导航系统", ready: "就绪", mission: "任务 01", start: "开始", hint: "移动  ·  闪避  ·  自动射击" },
    hud: { hull: "机体", shield: "护盾", score: "得分", combo: "连击", altitude: "高度", wave: "波次", phase: "阶段", ultimate: "终极能量", ultimateReady: "终极技能就绪", activate: "空格  /  点击" },
    upgrade: { choose: "选择一项强化", paused: "系统已暂停", level: "等级", online: "已上线" },
    level: { level: "关卡", complete: "关卡完成", incoming: "进入新战区", objective: "任务目标", objectives: { destroy: "消灭敌军", survive: "坚持生存", escort: "护送目标", hunt: "猎杀优先目标", chase: "追击目标", escape: "逃离追击", protect: "保护目标", breakthrough: "突破防线", boss: "首领战", "boss-rush": "连续首领战" } },
    rarity: { COMMON: "普通", RARE: "稀有", EPIC: "史诗", LEGENDARY: "传说" },
    messages: { mission: "任务 01  //  天穹坠落", boss: "警告  //  TITAN-01", climax: "警告  //  重型目标接近", phase2: "装甲破损  //  阶段 02", phase3: "警告  //  核心过载", finalStrike: "最终打击  //  核心暴露", ultimate: "时序超载" },
    gameOver: { complete: "任务完成", neutralised: "TITAN-01 已摧毁", gameOver: "任务失败", signalLost: "信号丢失", score: "得分", best: "最高得分", destroyed: "击毁敌机", maxCombo: "最高连击", survival: "生存时间", retry: "再次出击", menu: "返回主界面" },
    pickups: { weapon: "武器", shield: "护盾", repair: "修复", bomb: "炸弹", magnet: "磁吸", energy: "能量" },
    pickupRules: { weapon: "武器等级 +1", shield: "恢复 30 点护盾", repair: "恢复 28 点机体", bomb: "清除普通敌机和敌弹，Boss 不会被秒杀", magnet: "拾取范围 +35", energy: "恢复 24 点终极能量" },
    upgrades: {
      twin: { name: "双联机炮", description: "部署两门同步侧翼炮。" }, rapid: { name: "高速射击", description: "射击循环加快 25%。" }, plasma: { name: "等离子弹", description: "弹丸可以穿透一个目标。" }, drone: { name: "攻击无人机", description: "增加自主侧翼火力。" }, shield: { name: "神盾系统", description: "提升并恢复护盾。" }, critical: { name: "暴击核心", description: "获得造成双倍伤害的概率。" }, missile: { name: "追踪导弹", description: "周期性发射自动追踪导弹。" }, laser: { name: "离子长枪", description: "周期性发射聚焦光束。" }, magnet: { name: "引力井", description: "从更远处吸取奖励。" }, repair: { name: "战地维修", description: "立即恢复机体完整度。" },
    },
  },
  ja: {
    languageName: "日本語", soundOn: "サウンド ON", soundOff: "サウンド OFF", controls: "移動 · 回避 · オート射撃", ultimateControl: "SPACE — アルティメット",
    menu: { start: "ゲーム開始", howToPlay: "遊び方", settings: "設定", back: "戻る", howTitle: "遊び方", pickupsTitle: "アイテム", move: "マウス、タッチ、方向キーで機体を移動。", fire: "武器は自動射撃。移動して狙います。", ultimate: "ゲージ最大時にSPACEまたは雷ボタン。", settingsTitle: "設定", sound: "BGM", language: "言語", languageHint: "言語の行をクリックして変更。", quality: "画質", high: "高", balanced: "バランス", performance: "パフォーマンス", antialiasing: "アンチエイリアス", on: "ON", off: "OFF", fps: "フレームレート", screenShake: "画面振動", effects: "モーション効果", full: "フル", reduced: "軽減", fullscreen: "全画面", exitFullscreen: "全画面を終了" },
    opening: { combatSystem: "戦闘飛行システム", weapon: "兵装システム", shield: "シールド", navigation: "ナビゲーション", ready: "準備完了", mission: "ミッション 01", start: "スタート", hint: "移動  ·  回避  ·  オート射撃" },
    hud: { hull: "機体", shield: "シールド", score: "スコア", combo: "コンボ", altitude: "高度", wave: "ウェーブ", phase: "フェーズ", ultimate: "アルティメット", ultimateReady: "アルティメット準備完了", activate: "SPACE  /  タップ" },
    upgrade: { choose: "アップグレードを選択", paused: "システム一時停止", level: "LV.", online: "オンライン" },
    level: { level: "レベル", complete: "レベルクリア", incoming: "新戦闘区域", objective: "目標", objectives: { destroy: "敵を撃破", survive: "生き残れ", escort: "護衛", hunt: "優先目標を撃破", chase: "追撃", escape: "離脱", protect: "防衛", breakthrough: "突破", boss: "ボス戦", "boss-rush": "ボスラッシュ" } },
    rarity: { COMMON: "コモン", RARE: "レア", EPIC: "エピック", LEGENDARY: "レジェンダリー" },
    messages: { mission: "ミッション 01  //  SKYFALL", boss: "警告  //  TITAN-01", climax: "警告  //  大型機接近", phase2: "装甲損傷  //  フェーズ 02", phase3: "警告  //  コア過負荷", finalStrike: "ファイナルストライク  //  コア露出", ultimate: "テンポラル・オーバードライブ" },
    gameOver: { complete: "ミッション完了", neutralised: "TITAN-01 無力化", gameOver: "ゲームオーバー", signalLost: "信号消失", score: "スコア", best: "ベストスコア", destroyed: "撃破数", maxCombo: "最大コンボ", survival: "生存時間", retry: "リトライ", menu: "メインメニュー" },
    pickups: { weapon: "ウェポン", shield: "シールド", repair: "リペア", bomb: "ボム", magnet: "マグネット", energy: "エネルギー" },
    pickupRules: { weapon: "武器レベル +1", shield: "シールドを30回復", repair: "機体を28回復", bomb: "通常敵と敵弾を全消去、Bossは即死しない", magnet: "回収範囲 +35", energy: "必殺エネルギーを24回復" },
    upgrades: {
      twin: { name: "ツインキャノン", description: "同期式ウイングガンを2門追加。" }, rapid: { name: "ラピッドファイア", description: "射撃サイクルを25%高速化。" }, plasma: { name: "プラズマ", description: "弾丸が敵を1体貫通する。" }, drone: { name: "ストライクドローン", description: "自律支援ドローンを追加。" }, shield: { name: "イージスシールド", description: "シールド容量を増加し全回復。" }, critical: { name: "クリティカルコア", description: "ダブルダメージの確率を獲得。" }, missile: { name: "シーカー", description: "追尾ミサイルを定期発射。" }, laser: { name: "イオンランス", description: "高出力ビームを定期照射。" }, magnet: { name: "グラビティウェル", description: "遠くの報酬を引き寄せる。" }, repair: { name: "フィールドリペア", description: "機体耐久値を即座に回復。" },
    },
  },
  ko: {
    languageName: "한국어", soundOn: "사운드 켬", soundOff: "사운드 끔", controls: "이동 · 회피 · 자동 사격", ultimateControl: "SPACE — 궁극기",
    menu: { start: "게임 시작", howToPlay: "플레이 방법", settings: "설정", back: "뒤로", howTitle: "플레이 방법", pickupsTitle: "아이템", move: "마우스, 터치 또는 방향키로 이동합니다.", fire: "무기는 자동 발사되며 이동으로 조준합니다.", ultimate: "에너지가 가득 차면 SPACE 또는 번개 버튼.", settingsTitle: "설정", sound: "배경 음악", language: "언어", languageHint: "언어 행을 클릭하여 변경하세요.", quality: "그래픽 품질", high: "높음", balanced: "균형", performance: "성능 우선", antialiasing: "안티앨리어싱", on: "켬", off: "끔", fps: "프레임 제한", screenShake: "화면 흔들림", effects: "모션 효과", full: "전체", reduced: "감소", fullscreen: "전체 화면", exitFullscreen: "전체 화면 종료" },
    opening: { combatSystem: "전투 비행 시스템", weapon: "무기 시스템", shield: "실드", navigation: "항법 시스템", ready: "준비 완료", mission: "미션 01", start: "시작", hint: "이동  ·  회피  ·  자동 사격" },
    hud: { hull: "기체", shield: "실드", score: "점수", combo: "콤보", altitude: "고도", wave: "웨이브", phase: "페이즈", ultimate: "궁극기", ultimateReady: "궁극기 준비 완료", activate: "SPACE  /  탭" },
    upgrade: { choose: "업그레이드 선택", paused: "시스템 일시 정지", level: "LV.", online: "온라인" },
    level: { level: "레벨", complete: "레벨 완료", incoming: "새 전투 구역", objective: "목표", objectives: { destroy: "적 섬멸", survive: "생존", escort: "호위", hunt: "우선 표적 제거", chase: "추격", escape: "탈출", protect: "보호", breakthrough: "돌파", boss: "보스전", "boss-rush": "보스 러시" } },
    rarity: { COMMON: "일반", RARE: "희귀", EPIC: "영웅", LEGENDARY: "전설" },
    messages: { mission: "미션 01  //  SKYFALL", boss: "경고  //  TITAN-01", climax: "경고  //  중형 목표 접근", phase2: "장갑 손상  //  페이즈 02", phase3: "경고  //  코어 과부하", finalStrike: "파이널 스트라이크  //  코어 노출", ultimate: "템포럴 오버드라이브" },
    gameOver: { complete: "미션 완료", neutralised: "TITAN-01 무력화", gameOver: "게임 오버", signalLost: "신호 손실", score: "점수", best: "최고 점수", destroyed: "적 격추", maxCombo: "최대 콤보", survival: "생존 시간", retry: "재도전", menu: "메인 메뉴" },
    pickups: { weapon: "무기", shield: "실드", repair: "수리", bomb: "폭탄", magnet: "자석", energy: "에너지" },
    pickupRules: { weapon: "무기 레벨 +1", shield: "실드 30 회복", repair: "기체 28 회복", bomb: "일반 적과 적탄 제거, Boss 즉사 없음", magnet: "획득 범위 +35", energy: "궁극기 에너지 24 회복" },
    upgrades: {
      twin: { name: "트윈 캐논", description: "동기화된 윙 건 두 문을 배치합니다." }, rapid: { name: "래피드 파이어", description: "사격 주기를 25% 가속합니다." }, plasma: { name: "플라즈마", description: "탄환이 적 하나를 관통합니다." }, drone: { name: "스트라이크 드론", description: "자율 측면 지원기를 추가합니다." }, shield: { name: "이지스 실드", description: "실드 용량을 늘리고 복구합니다." }, critical: { name: "크리티컬 코어", description: "두 배 피해 확률을 얻습니다." }, missile: { name: "시커", description: "유도 미사일을 주기적으로 발사합니다." }, laser: { name: "이온 랜스", description: "집중 광선을 주기적으로 발사합니다." }, magnet: { name: "중력 우물", description: "더 먼 보상을 끌어당깁니다." }, repair: { name: "현장 수리", description: "기체 내구도를 즉시 복구합니다." },
    },
  },
  es: {
    languageName: "Español", soundOn: "SONIDO SÍ", soundOff: "SONIDO NO", controls: "MOVER · ESQUIVAR · FUEGO AUTO", ultimateControl: "ESPACIO — DEFINITIVA",
    menu: { start: "INICIAR JUEGO", howToPlay: "CÓMO JUGAR", settings: "AJUSTES", back: "VOLVER", howTitle: "CÓMO JUGAR", pickupsTitle: "OBJETOS", move: "Muévete con ratón, toque o flechas.", fire: "Las armas disparan solas. Muévete para apuntar.", ultimate: "Usa ESPACIO o el botón de rayo con energía llena.", settingsTitle: "AJUSTES", sound: "MÚSICA", language: "IDIOMA", languageHint: "Pulsa la fila de idioma para cambiar.", quality: "CALIDAD GRÁFICA", high: "ALTA", balanced: "EQUILIBRADA", performance: "RENDIMIENTO", antialiasing: "ANTIALIASING", on: "SÍ", off: "NO", fps: "LÍMITE DE FPS", screenShake: "VIBRACIÓN", effects: "EFECTOS DE MOVIMIENTO", full: "COMPLETOS", reduced: "REDUCIDOS", fullscreen: "PANTALLA COMPLETA", exitFullscreen: "SALIR DE PANTALLA" },
    opening: { combatSystem: "SISTEMA DE VUELO DE COMBATE", weapon: "SISTEMA DE ARMAS", shield: "ESCUDO", navigation: "NAVEGACIÓN", ready: "LISTO", mission: "MISIÓN 01", start: "INICIAR", hint: "MOVER  ·  ESQUIVAR  ·  FUEGO AUTO" },
    hud: { hull: "CASCO", shield: "ESCUDO", score: "PUNTOS", combo: "COMBO", altitude: "ALT", wave: "OLEADA", phase: "FASE", ultimate: "DEFINITIVA", ultimateReady: "DEFINITIVA LISTA", activate: "ESPACIO  /  TOCAR" },
    upgrade: { choose: "ELIGE UNA MEJORA", paused: "SISTEMA EN PAUSA", level: "NV.", online: "EN LÍNEA" },
    level: { level: "NIVEL", complete: "NIVEL COMPLETADO", incoming: "NUEVA ZONA DE COMBATE", objective: "OBJETIVO", objectives: { destroy: "DESTRUIR ENEMIGOS", survive: "SOBREVIVIR", escort: "ESCOLTAR", hunt: "CAZAR OBJETIVO", chase: "PERSEGUIR", escape: "ESCAPAR", protect: "PROTEGER", breakthrough: "ROMPER EL FRENTE", boss: "BATALLA DE JEFE", "boss-rush": "JEFE TRAS JEFE" } },
    rarity: { COMMON: "COMÚN", RARE: "RARO", EPIC: "ÉPICO", LEGENDARY: "LEGENDARIO" },
    messages: { mission: "MISIÓN 01  //  SKYFALL", boss: "ALERTA  //  TITAN-01", climax: "ALERTA  //  CONTACTO PESADO", phase2: "FALLO DE BLINDAJE  //  FASE 02", phase3: "ALERTA  //  NÚCLEO SOBRECARGADO", finalStrike: "GOLPE FINAL  //  NÚCLEO EXPUESTO", ultimate: "SOBREMARCHA TEMPORAL" },
    gameOver: { complete: "MISIÓN COMPLETADA", neutralised: "TITAN-01 NEUTRALIZADO", gameOver: "FIN DE PARTIDA", signalLost: "SEÑAL PERDIDA", score: "PUNTOS", best: "MEJOR PUNTUACIÓN", destroyed: "ENEMIGOS DESTRUIDOS", maxCombo: "COMBO MÁXIMO", survival: "TIEMPO DE SUPERVIVENCIA", retry: "REINTENTAR", menu: "MENÚ PRINCIPAL" },
    pickups: { weapon: "ARMA", shield: "ESCUDO", repair: "REPARACIÓN", bomb: "BOMBA", magnet: "IMÁN", energy: "ENERGÍA" },
    pickupRules: { weapon: "Nivel de arma +1", shield: "Recupera 30 de escudo", repair: "Recupera 28 de casco", bomb: "Elimina enemigos normales y balas; no mata al Boss", magnet: "Alcance de recogida +35", energy: "Recupera 24 de energía final" },
    upgrades: {
      twin: { name: "CAÑÓN DOBLE", description: "Despliega dos cañones de ala sincronizados." }, rapid: { name: "FUEGO RÁPIDO", description: "Acelera el ciclo de disparo un 25 %." }, plasma: { name: "PLASMA", description: "Los proyectiles atraviesan un objetivo." }, drone: { name: "DRON DE ATAQUE", description: "Añade apoyo autónomo en los flancos." }, shield: { name: "ESCUDO AEGIS", description: "Aumenta y restaura el escudo." }, critical: { name: "NÚCLEO CRÍTICO", description: "Añade probabilidad de daño doble." }, missile: { name: "BUSCADOR", description: "Lanza misiles guiados periódicamente." }, laser: { name: "LANZA IÓNICA", description: "Emite un haz concentrado periódico." }, magnet: { name: "POZO GRAVITATORIO", description: "Atrae recompensas desde más lejos." }, repair: { name: "REPARACIÓN DE CAMPO", description: "Restaura el casco inmediatamente." },
    },
  },
};

export function detectLanguage(): Language {
  let saved: Language | null = null;
  try { saved = localStorage.getItem("skyfall-language") as Language | null; } catch { /* storage is optional */ }
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("zh")) return "zh-CN";
  if (browser.startsWith("ja")) return "ja";
  if (browser.startsWith("ko")) return "ko";
  if (browser.startsWith("es")) return "es";
  return "en";
}
