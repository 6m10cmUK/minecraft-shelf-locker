import {
    world,
    system
} from "@minecraft/server";

// Dynamic Property Key for lock state persistence
const ADDON_LOCK_KEY = "addon:shelf_lock_enabled";

// 対象棚系ブロックID
const TARGET_SHELF_BLOCKS = new Set([
    "minecraft:oak_shelf",
    "minecraft:spruce_shelf",
    "minecraft:birch_shelf",
    "minecraft:jungle_shelf",
    "minecraft:acacia_shelf",
    "minecraft:dark_oak_shelf",
    "minecraft:mangrove_shelf",
    "minecraft:cherry_shelf",
    "minecraft:pale_oak_shelf",
    "minecraft:bamboo_shelf",
    "minecraft:crimson_shelf",
    "minecraft:warped_shelf"
]);

// デバッグモード
const DEBUG_MODE = false;

/**
 * デバッグログ出力用
 * @param {string} message ログメッセージ
 * @param {string} level ログレベル ('info', 'warn', 'error')
 */
function log(message, level = 'info') {
    if (!DEBUG_MODE && level === 'info') return;

    const prefix = "[Shelf Lock]";
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
        case 'error':
            console.error(fullMessage);
            break;
        case 'warn':
            console.warn(fullMessage);
            break;
        default:
            console.warn(fullMessage); // console.info は存在しないため warn を使用
    }
}


// -----------------------------------------------------
// 起動処理: Dynamic Propertyの初期化
// -----------------------------------------------------
system.runInterval(() => {
    try {
        // 初回実行時のみ初期化（デフォルトはtrue=ロック有効）
        if (world.getDynamicProperty(ADDON_LOCK_KEY) === undefined) {
            world.setDynamicProperty(ADDON_LOCK_KEY, true);
            log("Dynamic Property initialized to 'true' (locked).", 'warn');
        }
    } catch (e) {
        log(`Failed to initialize: ${e}`, 'error');
    }
}, 1); // 1 tick後に実行

// -----------------------------------------------------
// scriptevent コマンド処理
// -----------------------------------------------------
system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id === 'shelflock:on') {
        try {
            world.setDynamicProperty(ADDON_LOCK_KEY, true);
            if (event.sourceEntity) {
                event.sourceEntity.sendMessage("§a[Shelf Lock] ロックを有効化しました。");
            }
            log(`Lock enabled.`, 'warn');
        } catch (error) {
            log(`Error enabling lock: ${error}`, 'error');
        }
    } else if (event.id === 'shelflock:off') {
        try {
            world.setDynamicProperty(ADDON_LOCK_KEY, false);
            if (event.sourceEntity) {
                event.sourceEntity.sendMessage("§c[Shelf Lock] ロックを無効化しました。");
            }
            log(`Lock disabled.`, 'warn');
        } catch (error) {
            log(`Error disabling lock: ${error}`, 'error');
        }
    } else if (event.id === 'shelflock:status') {
        try {
            const lockState = world.getDynamicProperty(ADDON_LOCK_KEY) ?? false;
            if (event.sourceEntity) {
                event.sourceEntity.sendMessage(`§e[Shelf Lock] 現在の状態: ${lockState ? '§a有効(ON)' : '§c無効(OFF)'}`);
            }
        } catch (error) {
            log(`Error checking status: ${error}`, 'error');
        }
    }
});

// -----------------------------------------------------
// イベント処理
// -----------------------------------------------------
world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    try {
        // ブロックID確認
        if (!TARGET_SHELF_BLOCKS.has(event.block.typeId)) {
            return;
        }

        // ロック状態確認
        const isLocked = world.getDynamicProperty(ADDON_LOCK_KEY) ?? false;
        if (!isLocked) {
            return;
        }

        event.source;
        event.cancel = true;
    } catch (error) {
        log(`Error in itemUseOn event handler: ${error}`, 'error');
    }
});

log("Addon loaded successfully.", 'warn');
