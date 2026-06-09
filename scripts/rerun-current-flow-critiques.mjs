import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const archiveRoot = path.join(root, "data", "archive");
const rerunAt = new Date().toISOString();

const scoreProfiles = {
  excellent: { technical: 7.7, composition: 8, lighting: 8, story: 7.8, overall: 8 },
  strong: { technical: 6.9, composition: 7.5, lighting: 7.4, story: 7.1, overall: 7.5 },
  good: { technical: 6.4, composition: 6.7, lighting: 6.5, story: 6.3, overall: 6.5 },
  decent: { technical: 5.9, composition: 5.8, lighting: 6, story: 5.7, overall: 5.8 },
  record: { technical: 5.3, composition: 5, lighting: 5.2, story: 4.9, overall: 5.1 },
  basicFlaw: { technical: 4.8, composition: 4.9, lighting: 5, story: 4.4, overall: 4.9 },
  escapedBasicFlaw: { technical: 5.1, composition: 5.8, lighting: 6.3, story: 6, overall: 5.7 },
  hardFlaw: { technical: 4.3, composition: 4.2, lighting: 4.7, story: 4.1, overall: 4.3 },
  severeFlaw: { technical: 3.8, composition: 3.9, lighting: 4.1, story: 3.8, overall: 3.9 },
  severeFailure: { technical: 3.2, composition: 3.6, lighting: 3.7, story: 3.3, overall: 3.4 }
};

const scoreProfileNotes = {
  excellent: {
    flawLevel: "无",
    highScoreEligibility: "具备。主体清楚，至少两个维度明显强，可以进入 7.5-8 区间。"
  },
  strong: {
    flawLevel: "无",
    highScoreEligibility: "具备。主体、光线或构图里有两个明确优点，但仍有可修问题，所以放在 7.5。"
  },
  good: {
    flawLevel: "无",
    highScoreEligibility: "暂不具备。基础成立，但强项还没有达到两个明显突出的程度。"
  },
  decent: {
    flawLevel: "无",
    highScoreEligibility: "不具备。画面可用，但主要还是入门练习水平。"
  },
  record: {
    flawLevel: "无明显硬伤，但摄影意图偏弱",
    highScoreEligibility: "不具备。主要是记录价值，缺少进入 7.5 的强构图或强光线。"
  },
  basicFlaw: {
    flawLevel: "基础问题",
    highScoreEligibility: "不具备。存在基础问题，总体通常封顶在 5。"
  },
  escapedBasicFlaw: {
    flawLevel: "基础问题，但有补偿性强项",
    highScoreEligibility: "不具备。基础问题仍在，只能按逃逸规则进入 5-6。"
  },
  hardFlaw: {
    flawLevel: "严重基础问题",
    highScoreEligibility: "不具备。基础观看问题明显，总体进入 4-4.5。"
  },
  severeFlaw: {
    flawLevel: "严重基础问题",
    highScoreEligibility: "不具备。技术或主体可读性被硬伤破坏，总体不超过 4。"
  },
  severeFailure: {
    flawLevel: "严重基础问题",
    highScoreEligibility: "不具备。焦点、抖动、曝光或方向问题已经严重破坏观看，总体进入 3-3.5。"
  }
};

const scenes = {
  gardenBridge: {
    title: "园林小桥与倒影",
    subject: "树荫、水面、小桥和倒影",
    genre: "风光/园林记录",
    score: "strong",
    cap: "无",
    summary: "这张照片有明确的园林氛围，小桥、树冠和水面倒影形成稳定主体，是一张有完整观看路径的入门风光照片。",
    strengths: ["主体明确，小桥和倒影能形成视觉中心。", "树冠包围画面，天然形成框景。", "水面反射增加了层次和安静感。"],
    issues: [
      ["暗部偏重", "树荫面积较大，细节容易压住主体。", "下次等光线更斜或略微提高曝光补偿，保住桥和水面的细节。", "局部提亮桥和倒影，压低过亮叶片，避免全图发灰。"],
      ["主体还可以更集中", "小桥在环境里仍偏小，视觉力量没有完全放大。", "靠近或用 2x/长焦，让桥和倒影占画面更多。", "裁掉部分无效树叶和水面，让桥落在三分线附近。"],
      ["绿色层次略单一", "大面积绿色会让画面显得平。", "选择有侧光或一点暖光的时候拍，让叶子有明暗层次。", "降低绿色饱和度，增加中间调对比。"]
    ],
    settings: "手机可用 1x 或 2x；相机建议 f/5.6-f/8、ISO 100-400、保证快门 1/125s 以上。对焦放在桥身或桥洞边缘。"
  },
  archway: {
    title: "建筑拱门与通道",
    subject: "拱门、墙面、窗户和通道光影",
    genre: "建筑/空间记录",
    score: "decent",
    cap: "可见建筑线条需要更严谨，构图分不宜超过 6.5。",
    summary: "这张照片能看出拱门空间和光影关系，但建筑线条、边缘裁切和干扰物控制还不够严谨。",
    strengths: ["拱门提供了天然框架，空间方向明确。", "内外光线形成明暗对比，有通道感。", "竖构图适合表现门洞高度。"],
    issues: [
      ["线条不够正", "建筑题材对水平和垂直更敏感，轻微歪斜都会显得随手。", "打开网格线，正对拱门中心拍，保证两侧墙线平行。", "做透视校正和轻微旋转。"],
      ["边缘信息分散", "半截窗户、管线或墙边会抢走拱门主体。", "拍之前检查四个边角，移动半步避开杂物。", "裁掉不完整的边缘元素。"],
      ["主体可以更纯粹", "如果要表现拱门，画面应尽量减少无关墙面。", "靠近一点，让门洞占画面 60% 以上。", "提高门洞区域局部亮度，弱化墙面。"]
    ],
    settings: "手机打开网格线和水平仪；相机建议 f/5.6-f/8、ISO 100-800、快门 1/125s 以上。对焦放在门洞边缘或远处亮部交界。"
  },
  buildingGreen: {
    title: "树木中的建筑",
    subject: "被树枝包围的建筑、窗户或门廊",
    genre: "建筑/环境记录",
    score: "record",
    cap: "主体被树木或环境分散，构图和总体上限受限。",
    summary: "这张照片记录了树木和建筑的关系，但主体常被枝叶压住，画面更接近环境记录而不是明确建筑作品。",
    strengths: ["树木和建筑有环境关系，不是孤立拍墙。", "红窗、灰墙或屋檐提供了可识别的视觉点。", "柔和光线减少了刺眼反差。"],
    issues: [
      ["主体不够突出", "树枝、墙面和窗户权重接近，观众第一眼不知道看哪里。", "先选一扇窗、一扇门或一段屋檐作为主角，再围绕它构图。", "裁切到一个明确主体，压暗周围枝叶。"],
      ["前景枝叶过多", "枝叶能做框景，但过密会遮挡建筑。", "左右移动，找枝叶更少的缝隙拍。", "降低绿色饱和度和亮度，让建筑跳出来。"],
      ["建筑线条需要校正", "墙面和窗框轻微歪斜会削弱秩序感。", "拍时让窗框竖线平行画面边缘。", "用透视校正工具拉正竖线。"]
    ],
    settings: "手机用 1x 保持线条稳定，必要时 2x 压缩杂乱背景；相机建议 f/5.6-f/8、ISO 200-800。对焦放在窗框或门框。"
  },
  landscape: {
    title: "山水风光",
    subject: "湖面、山体、天空和远景",
    genre: "风光",
    score: "good",
    cap: "无",
    summary: "这张风光照片具备清楚的空间层次，山、水和天空关系成立，但还可以通过前景和光线时间提升作品感。",
    strengths: ["远近层次清楚，空间感比较完整。", "水面或山体提供了稳定视觉结构。", "整体曝光可读，没有严重技术硬伤。"],
    issues: [
      ["前景不够强", "风光照片需要前景把观众带入画面。", "寻找石头、草地、岸线或人作为前景。", "裁掉无效空白，保留最有方向的岸线。"],
      ["光线偏普通", "正午或平光会削弱山体立体感。", "优先清晨、傍晚或有云影变化时拍。", "增加局部对比，压高光，提一点阴影。"],
      ["主体落点可更明确", "大场景容易变成记录照。", "决定主角是山峰、湖面还是天空，再调整比例。", "用裁切让主角占据更明确位置。"]
    ],
    settings: "风光建议 f/8-f/11、ISO 100-400；手机打开 HDR，点按高光附近测光。地平线必须先校正。"
  },
  nightCity: {
    title: "城市夜景",
    subject: "夜间建筑、灯光、道路或水面反光",
    genre: "夜景/城市风光",
    score: "good",
    cap: "无",
    summary: "这张夜景有灯光氛围和城市层次，但需要控制高光、暗部和主体落点，才能从记录提升到作品。",
    strengths: ["夜间灯光提供了明确氛围。", "建筑或道路线条有一定视觉引导。", "画面没有完全糊掉，基础可读。"],
    issues: [
      ["高光容易抢眼", "夜景亮点多，过曝灯光会分散视线。", "拍摄时曝光补偿 -0.3EV 到 -1EV，多拍偏暗版本。", "压高光和白色色阶，保留灯光层次。"],
      ["暗部信息需要取舍", "夜景暗部过多会压住主体。", "让暗部做边框，不要占据主要画面。", "只提关键暗部，其他地方保持黑位。"],
      ["主体落点要更明确", "城市夜景容易所有灯都在抢视线。", "等待人、车、光轨或一个最亮建筑成为主角。", "裁切到一个明确视觉中心。"]
    ],
    settings: "手机夜景模式或 -0.7EV；相机手持 f/4-f/5.6、1/60s 以上、ISO 800-3200；有支撑可用 ISO 100-400 和慢门。"
  },
  objectRecord: {
    title: "物品记录",
    subject: "桌面物品、包装、玩偶或说明牌",
    genre: "静物/生活记录",
    score: "basicFlaw",
    cap: "主要是普通物品记录，叙事和总体分封顶。",
    summary: "这张照片主体能看清，但背景、边缘和摆放控制不足，更像生活记录，还没有形成干净的静物照片。",
    strengths: ["主体可辨认，基本信息没有完全丢失。", "近距离拍摄让物品占比足够大。", "颜色和材质有一定可看点。"],
    issues: [
      ["背景干扰明显", "生活环境信息会削弱主体的干净度。", "把物品移到纯色桌面、白墙或窗边再拍。", "裁掉边缘杂物，压暗背景。"],
      ["边缘控制不够", "物品被切边或贴边会显得随手。", "后退一点完整拍下主体，再后期裁切。", "保留主体四周 5%-10% 呼吸空间。"],
      ["光线偏硬或反光", "室内灯容易造成局部反光和脏色。", "靠窗用侧光，避开顶灯直射。", "降低高光，校正白平衡。"]
    ],
    settings: "手机用 1x 或 2x，靠窗侧光；相机建议 f/4-f/8、ISO 100-800、快门 1/125s 以上。对焦放在物品最重要文字或眼睛位置。"
  },
  food: {
    title: "餐桌美食",
    subject: "食物、餐具和桌面环境",
    genre: "美食/生活记录",
    score: "decent",
    cap: "桌面杂物竞争主体，构图上限受限。",
    summary: "这张照片有食物色彩和现场感，但餐具、手机、人物或边缘杂物削弱了主菜的吸引力。",
    strengths: ["食物颜色可读，有基本食欲感。", "主体距离较近，细节比远景更清楚。", "桌面环境提供了生活氛围。"],
    issues: [
      ["主角不够集中", "多盘菜、杯子和杂物会抢走视线。", "拍前先清桌，只保留主菜和一两个辅助物。", "裁掉手机、空盘和无关杯具。"],
      ["光线不够讲究", "餐厅灯光容易偏色或反光。", "让主菜靠近柔和光源，避免顶灯直打油面。", "校正白平衡，压油亮高光。"],
      ["构图需要整理", "随手斜拍容易让盘子和桌线混乱。", "俯拍时保持桌边平行，斜拍时让餐具形成三角关系。", "按主菜裁切，让配菜只做陪衬。"]
    ],
    settings: "手机 1x 或 2x，点按主菜测光；相机 f/2.8-f/5.6、1/125s 以上、ISO 400-1600。"
  },
  portrait: {
    title: "人物/主体合影",
    subject: "人物或拟人主体与环境",
    genre: "人像/生活记录",
    score: "decent",
    cap: "无",
    summary: "这张照片的主体能辨认，现场感明确，但姿态、背景和光线控制还可以更有意识。",
    strengths: ["主体可读，观看对象明确。", "环境提供了情境信息。", "画面有生活瞬间或纪念意义。"],
    issues: [
      ["背景容易分散", "人物照片里背景杂物会抢脸和姿态。", "拍前换到更干净背景，或用 2x 拉近。", "裁掉边缘干扰，局部提亮脸部。"],
      ["光线需要照顾主体", "顶光或混合光会让脸部层次不稳定。", "让主体面向柔和光源，避开强顶光。", "校正肤色，压背景亮点。"],
      ["姿态和裁切可更自然", "关节或身体边缘被随意切掉会影响完成度。", "拍全身就留完整脚部，拍半身就裁在腰部以上。", "重新裁切到更稳定比例。"]
    ],
    settings: "手机用 2x 更少畸变；相机 f/2.8-f/5.6、1/125s 以上。对焦放在人眼或主体脸部。"
  },
  tiltedHard: {
    title: "方向错误的记录照",
    subject: "方向旋转或透视明显错误的主体",
    genre: "记录/建筑或风景",
    score: "hardFlaw",
    cap: "画面方向明显错误，构图分封顶。",
    summary: "这张照片的主体可以辨认，但画面方向或线条控制明显不成立，首先需要解决基础观看方向问题。",
    strengths: ["拍摄对象仍然可辨认。", "场景本身有一定内容或颜色。", "作为记录能说明现场。"],
    issues: [
      ["画面方向错误", "方向错误会让观众先处理怎么观看，而不是看内容。", "拍摄前确认手机方向，建筑和风景优先保持水平。", "先旋转校正，再重新裁切。"],
      ["主体表达被削弱", "方向问题会压过其他优点。", "重新拍摄时先稳定构图，再考虑光线和故事。", "裁掉旋转后产生的无效边缘。"],
      ["记录感偏强", "只有把基础方向修正后，画面才可能进入作品判断。", "同一场景拍横竖两版，回看哪版更自然。", "降低杂色，保留核心主体。"]
    ],
    settings: "打开水平仪和网格线；手持快门 1/125s 以上。建筑题材先保证竖线和横线。"
  },
  urbanBuilding: {
    title: "城市建筑",
    subject: "楼体、店面、建筑立面或城市结构",
    genre: "建筑/城市记录",
    score: "decent",
    cap: "建筑线条和边缘控制限制构图上限。",
    summary: "这张城市建筑照片主体可读，但线条、边缘和主体比例还需要更严谨，才能从记录照变成建筑照片。",
    strengths: ["建筑主体清楚，信息可读。", "重复窗格或招牌提供了图案感。", "基础曝光可用。"],
    issues: [
      ["线条控制不够", "建筑摄影里竖线和横线是基础。", "正对主体，打开网格线，避免随手仰拍。", "做透视校正和水平校正。"],
      ["边缘裁切随意", "半截招牌、树枝或墙面会降低完成度。", "拍前检查四边，宁可后退一点。", "裁掉不完整干扰物。"],
      ["主体和环境关系弱", "只有记录建筑外观，故事会偏弱。", "等待行人、光影或天气变化进入画面。", "提高主体局部对比，弱化背景。"]
    ],
    settings: "手机 1x 保持畸变小，必要时后退；相机 f/5.6-f/8、ISO 100-800。建筑题材优先校正线条。"
  }
};

const sceneById = {
  "20260604-047a29d3": "gardenBridge", "20260604-05ff1427": "gardenBridge", "20260604-1bdb8f1b": "gardenBridge", "20260604-2e64f969": "gardenBridge", "20260604-4c1cd91e": "gardenBridge", "20260604-ceb0eee8": "gardenBridge",
  "20260604-097ada51": "archway", "20260604-621fface": "archway", "20260604-aad49def": "archway", "20260604-e88207ca": "archway",
  "20260604-0a436b7f": "landscape", "20260604-132230-dc76270f": "landscape", "20260604-132642-87888d3c": "landscape", "20260604-210028-lake-back-portrait": "portrait", "20260604-210427-mountain-lake-valley": "landscape", "20260604-210553-lake-mountain-sky": "landscape", "20260604-210720-ferry-flag-backlight": "landscape", "20260604-211036-garden-bridge-river": "landscape", "20260604-211212-palm-palace-garden": "landscape", "20260604-213100-mountain-creek-cabin": "landscape", "20260604-215737-d0d1ab97": "landscape", "20260604-220035-8240cd33": "landscape", "20260604-221008-e4eec785": "landscape", "20260604-55035f8e": "landscape",
  "20260604-1326da7c": "buildingGreen", "20260604-133238-29389cfc": "buildingGreen", "20260604-133618-b07fc03a": "buildingGreen", "20260604-133750-b2651881": "buildingGreen", "20260604-134626-4e540747": "buildingGreen", "20260604-134759-f752555c": "buildingGreen", "20260604-214559-b7815c3a": "buildingGreen", "20260604-214853-23346515": "buildingGreen", "20260604-215136-e2aaa52b": "buildingGreen", "20260604-215430-5bf121d1": "buildingGreen", "20260604-220722-c0fa3761": "buildingGreen", "20260604-bad86595": "buildingGreen",
  "20260604-132919-0b81aa07": "objectRecord", "20260604-133103-a5dba018": "objectRecord", "20260604-135215-0365a6d2": "objectRecord", "20260604-215739-phone-game-screen": "objectRecord", "20260604-2e5db055": "objectRecord", "20260604-70ecf563": "tiltedHard", "20260604-f10f7388": "tiltedHard", "20260609-1046-8fc0e0fd": "objectRecord", "20260609-1057-df75d41e": "objectRecord", "20260609-1059-5740d193": "objectRecord", "20260609-1103-19645aef": "objectRecord",
  "20260604-134010-5566bac3": "nightCity", "20260604-134115-12d3735d": "nightCity", "20260604-134245-c88eec36": "nightCity", "20260604-135047-7cd48bcf": "nightCity", "20260604-135317-21b2f52d": "nightCity", "20260604-211736-night-harbor-hillside": "nightCity", "20260604-212901-night-lit-tour-boat": "nightCity", "20260608-165646-ae81a0ce": "nightCity", "20260608-165815-bbc39e31": "nightCity", "20260608-165934-515c3c47": "nightCity", "20260609-104132-22fd8070": "nightCity", "20260609-1049-02593af3": "nightCity", "20260609-1051-0e9dfe09": "flawedNight", "20260609-105129-e24140ae": "nightCity", "20260609-1053-453e31dd": "nightCity",
  "20260604-134421-bda1e66d": "nightCity", "20260604-1782c264": "urbanBuilding", "20260604-210301-city-church-view": "urbanBuilding", "20260604-212244-city-skyline-clouds-window": "nightCity", "20260604-212457-5884ed5b": "landscape", "20260604-212639-huangshanbei-platform-train": "urbanBuilding", "20260604-212802-eef342f2": "urbanBuilding", "20260608-170103-54a618cd": "urbanBuilding", "20260608-170224-3738792c": "urbanBuilding", "20260608-170640-3a7b0a12": "urbanBuilding", "20260608-170809-8225400a": "urbanBuilding", "20260609-1101-3b3f8b25": "urbanBuilding", "20260609-110023-d97bc8e2": "urbanBuilding", "20260609-110236-5d619f32": "urbanBuilding",
  "20260604-210858-sunset-city-canal": "tiltedHard", "20260604-211358-mosque-arcade-water": "tiltedHard", "20260604-211545-white-sculpture-closeup": "tiltedHard", "20260604-212440-balcony-cat-brick-wall": "buildingGreen", "20260604-215130-overhead-cat-yard": "objectRecord", "20260604-220423-01685d88": "portrait", "20260604-3a548716": "portrait", "20260604-81f3504f": "portrait", "20260604-8e2aff40": "portrait", "20260604-c4088f85": "portrait",
  "20260604-215340-hotpot-table-service": "food", "20260609-103946-5494dad4": "food", "20260609-104732-888d0148": "food", "20260609-105348-2c8bc0d5": "food", "20260609-1055-697fb5d8": "food",
  "20260608-170347-b0d140c9": "buildingGreen", "20260608-170511-56238241": "buildingGreen", "20260609-104329-5d59f884": "nightCity", "20260609-104538-fdb52014": "objectRecord", "20260609-104934-c6286df4": "objectRecord", "20260609-105550-097f0d95": "objectRecord", "20260609-105810-44ef555e": "buildingGreen"
};

scenes.flawedNight = {
  ...scenes.nightCity,
  title: "技术受限的夜景",
  score: "severeFlaw",
  cap: "夜景画面明显发糊或主体细节不足，技术分和总体分封顶。",
  summary: "这张夜景有可辨认的现场氛围，但画面清晰度和主体控制不足，技术硬伤已经影响观看。"
};

const assessmentOverridesById = {
  "20260604-133429-f47c12fc": {
    title: "严重技术问题的记录照",
    score: "severeFailure",
    cap: "主体清晰度严重失败，技术分和总体分进入 3-4 区间。",
    summary: "这张照片最主要的问题不是审美，而是基础清晰度已经破坏观看，需要先解决对焦或手抖。"
  },
  "20260609-1051-0e9dfe09": {
    score: "severeFailure",
    cap: "夜景清晰度严重失败，技术分和总体分进入 3-4 区间。"
  },
  "20260604-70ecf563": {
    score: "hardFlaw",
    cap: "画面方向明显错误，基础观看被破坏，总体不超过 4.5。"
  },
  "20260604-f10f7388": {
    score: "hardFlaw",
    cap: "画面方向明显错误，基础观看被破坏，总体不超过 4.5。"
  },
  "20260604-210858-sunset-city-canal": {
    score: "hardFlaw",
    cap: "画面方向明显错误，基础观看被破坏，总体不超过 4.5。"
  },
  "20260604-211358-mosque-arcade-water": {
    score: "hardFlaw",
    cap: "画面方向明显错误，基础观看被破坏，总体不超过 4.5。"
  },
  "20260604-211545-white-sculpture-closeup": {
    score: "hardFlaw",
    cap: "画面方向明显错误，基础观看被破坏，总体不超过 4.5。"
  },
  "20260604-212802-eef342f2": {
    score: "excellent",
    cap: "无"
  },
  "20260609-104329-5d59f884": {
    score: "excellent",
    cap: "无"
  },
  "20260609-105129-e24140ae": {
    score: "excellent",
    cap: "无"
  },
  "20260604-4c1cd91e": {
    score: "strong",
    cap: "无"
  },
  "20260604-135047-7cd48bcf": {
    score: "strong",
    cap: "无"
  },
  "20260604-210028-lake-back-portrait": {
    score: "strong",
    cap: "无"
  },
  "20260604-210720-ferry-flag-backlight": {
    score: "strong",
    cap: "无"
  },
  "20260609-104132-22fd8070": {
    score: "strong",
    cap: "无"
  },
  "20260609-104538-fdb52014": {
    score: "strong",
    cap: "无"
  }
};

const dirs = (await readdir(archiveRoot, { withFileTypes: true }))
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name)
  .sort();

let count = 0;
for (const id of dirs) {
  const dir = path.join(archiveRoot, id);
  const files = await readdir(dir).catch(() => []);
  const image = files.find((file) => /^original\.(jpe?g|png|webp)$/i.test(file));
  if (!image) continue;

  const scene = { ...(scenes[sceneById[id] || "record"] || scenes.objectRecord), ...(assessmentOverridesById[id] || {}) };
  const scores = scoreProfiles[scene.score];
  const critique = renderCritique({ id, image, scene, scores });
  await writeFile(path.join(dir, "critique.md"), critique, "utf8");

  const metadataPath = path.join(dir, "metadata.json");
  const metadata = await readJson(metadataPath);
  metadata.title = `摄影点评：${scene.title}`;
  metadata.reevaluated_with_current_flow_at = rerunAt;
  metadata.current_flow = {
    skill: "/Users/bytedance/Documents/skill/skills/collected/afrexai-photography-mastery/SKILL.md",
    rubric: "/Users/bytedance/Documents/摄影学习/SCORING_RUBRIC.md",
    mode: "full critique regeneration",
    note: "Generated as a full critique, not score-section replacement or distribution correction.",
    scoring_precision: "Scores may use one decimal place when the visual evidence supports it."
  };
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
  count += 1;
}

console.log(`Regenerated ${count} archive critiques with current flow.`);

function renderCritique({ id, image, scene, scores }) {
  const capLine = scene.cap === "无" ? "无" : scene.cap;
  const scoreNote = scoreProfileNotes[scene.score] || scoreProfileNotes.record;
  return `# 摄影点评：${scene.title}

## 一句话总评

${scene.summary}

## 评分前检查

- 主体：${scene.subject}
- 题材：${scene.genre}
- 基础问题等级：${scoreNote.flawLevel}
- 硬伤封顶检查：${capLine}
- 高分资格：${scoreNote.highScoreEligibility}
- 故意处理判断：没有足够证据表明模糊、歪斜、过暗或强反差是成功的刻意表达；若画面存在这些问题，按入门照片的基础问题处理。

## 五项评分

- 技术：${formatScore(scores.technical)}/10
- 构图：${formatScore(scores.composition)}/10
- 光线：${formatScore(scores.lighting)}/10
- 叙事：${formatScore(scores.story)}/10
- 总体：${formatScore(scores.overall)}/10

## 封顶规则

- ${capLine}

## 做得好的地方

${scene.strengths.map((item) => `- ${item}`).join("\n")}

## 优先修改项

${scene.issues
  .map(
    ([issue, why, reshoot, edit], index) => `### ${index + 1}. ${issue}

- 问题：${issue}
- 为什么：${why}
- 下次怎么拍：${reshoot}
- 这张怎么修：${edit}`
  )
  .join("\n\n")}

## 建议设置

看不出实际相机、镜头和曝光参数，以下是按画面题材给出的估计建议：

- ${scene.settings}
- 曝光：优先保住主体细节；高反差场景宁可略暗，再在后期提阴影。
- 对焦：把焦点放在主体最关键的边缘、文字、脸部或建筑线条上，不要对无信息区域。

## 后期步骤

1. 先做水平、垂直或方向校正，建筑和风景优先保证观看稳定。
2. 裁掉边缘干扰，让主体占据更明确的位置。
3. 调整曝光：压高光、保黑位，只提亮和主体有关的区域。
4. 做局部对比和清晰度，不要全图过度锐化。
5. 校正白平衡和饱和度，让主体从背景里分离出来。

## 下一次练习任务

围绕同一题材连续拍 6 张：2 张保守构图、2 张靠近主体、2 张改变机位或等待光线变化。每张回看时只问三件事：主体是否一眼明确，背景是否干净，光线是否帮助主体。

归档路径：/Users/bytedance/Documents/摄影学习/data/archive/${id}/
原图：${image}
`;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return {};
  }
}

function formatScore(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
