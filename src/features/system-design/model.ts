/** Educational, deterministic load model. Values describe these exercises, not vendor benchmarks. */
export type BlockKind =
    | 'client'
    | 'api'
    | 'database'
    | 'balancer'
    | 'cache'
    | 'queue'
    | 'worker'
    | 'cdn'
    | 'storage'
    | 'shard'
    | 'versioning'
    | 'coalescer'
    | 'transaction'
    | 'quorum'
    | 'replication'
    | 'dlq'
    | 'outbox'
    | 'limiter'
    | 'breaker'
    | 'timeout'
    | 'retry'
    | 'dedup'
export interface Block {
    id: string
    kind: BlockKind
    x: number
    y: number
}
export interface Wire {
    id: string
    source: string
    target: string
}
export interface Design {
    blocks: Block[]
    wires: Wire[]
}
export interface Exercise {
    id: string
    title: string
    topic: string
    description: string
    incident: string
    demand: number
    goal: string
    hint: string
    tradeoff: string
    allowed: BlockKind[]
    initial: Design
    sink: string
    track?: string
    scenario?: {
        route: BlockKind[]
        event: string
        success: string
        failure: string
        limits?: Partial<Record<BlockKind, number>>
        admitted?: number
    }
}
export const PARTS: Record<
    BlockKind,
    { label: string; detail: string; capacity: number; latency: number; short: string }
> = {
    dedup: {
        label: 'Дедупликация',
        detail: 'Ключ операции хранится вместе с результатом. Повтор с тем же ключом возвращает прежний результат, не повторяя эффект.',
        short: 'Operation ID',
        capacity: 20000,
        latency: 5,
    },
    retry: {
        label: 'Повторы с backoff',
        detail: 'Не более трёх попыток только при временных ошибках; экспоненциальная пауза и jitter. Без дедупликации повтор записи небезопасен.',
        short: '3 попытки',
        capacity: 20000,
        latency: 5,
    },
    timeout: {
        label: 'Таймаут',
        detail: 'Ограничивает ожидание зависимости 200 мс. Не отменяет уже выполненную удалённую операцию.',
        short: '200 мс',
        capacity: 20000,
        latency: 5,
    },
    breaker: {
        label: 'Circuit breaker',
        detail: 'После серии ошибок размыкает вызовы зависимости; пробный запрос в half-open проверяет восстановление.',
        short: 'Closed / open',
        capacity: 20000,
        latency: 5,
    },
    limiter: {
        label: 'Rate limiter',
        detail: 'Token bucket: принимает до 500 запросов/с; избытку отвечает 429 до обращения к зависимости.',
        short: '500 RPS',
        capacity: 20000,
        latency: 5,
    },
    outbox: {
        label: 'Transactional outbox',
        detail: 'Сохраняет изменение и событие одной локальной транзакцией. Relay повторяет публикацию до подтверждения.',
        short: 'State + event',
        capacity: 20000,
        latency: 5,
    },
    dlq: {
        label: 'DLQ-политика',
        detail: 'После трёх неуспешных обработок отправляет задание в отдельный карантин, освобождая очередь. Нормальные задания идут дальше.',
        short: '3 попытки → DLQ',
        capacity: 20000,
        latency: 5,
    },
    replication: {
        label: 'Primary / backup',
        detail: 'Группа из primary и синхронного backup: ACK после записи на оба узла. При отказе primary служба представлений назначает backup новым лидером с fencing epoch; разделение сети разбирается отдельно.',
        short: '2 реплики',
        capacity: 20000,
        latency: 5,
    },
    quorum: {
        label: 'Группа консенсуса',
        detail: 'Три участника с выбором лидера и журналом. Запись подтверждается большинством 2 из 3; меньшинство при разделении сети не пишет.',
        short: '2 из 3',
        capacity: 20000,
        latency: 5,
    },
    transaction: {
        label: 'Координатор 2PC',
        detail: 'Prepare всех участников перед commit. Решение хранится в журнале координатора; сбой до решения оставляет участников ждать восстановления.',
        short: 'Prepare → commit',
        capacity: 20000,
        latency: 5,
    },
    coalescer: {
        label: 'Single-flight',
        detail: 'Объединяет одновременные чтения одного ключа в один запрос. Разные ключи не объединяются.',
        short: 'Один ключ',
        capacity: 20000,
        latency: 5,
    },
    versioning: {
        label: 'Версии и инвалидация',
        detail: 'Сравнивает версии, не принимает устаревшее обновление кеша и инвалидирует запись после подтверждённой записи.',
        short: 'Version / CAS',
        capacity: 20000,
        latency: 5,
    },
    client: {
        label: 'Клиенты',
        detail: 'Источник запросов. Нагрузка задана условием.',
        capacity: Infinity,
        latency: 0,
        short: 'HTTP',
    },
    api: {
        label: 'API-сервер',
        detail: 'Обрабатывает до 1 000 запросов/с. Несколько серверов помогают только с распределением трафика.',
        capacity: 1000,
        latency: 30,
        short: '1 000 RPS',
    },
    database: {
        label: 'База данных',
        detail: 'До 1 000 запросов/с. Второй шард хранит другую часть ключей.',
        capacity: 1000,
        latency: 40,
        short: '1 000 RPS',
    },
    balancer: {
        label: 'Балансировщик',
        detail: 'Round-robin: делит запросы поровну между API-серверами.',
        capacity: 20000,
        latency: 5,
        short: 'Round-robin',
    },
    cache: {
        label: 'Кеш',
        detail: 'Повторные чтения могут обслуживаться из кеша. Записи и холодные промахи идут в БД; допустимая свежесть и hit rate заданы условием задачи.',
        capacity: 10000,
        latency: 2,
        short: 'Кеш чтений',
    },
    queue: {
        label: 'Очередь',
        detail: 'Сохраняет задания до подтверждения обработки и передаёт воркеру в его темпе. Возможны повторные доставки; для неисправимых сообщений нужна политика карантина.',
        capacity: 10000,
        latency: 5,
        short: 'Буфер 10 000',
    },
    worker: {
        label: 'Воркер',
        detail: 'Обрабатывает 200 заданий/с. После очереди работает асинхронно.',
        capacity: 200,
        latency: 300,
        short: '200 задач/с',
    },
    cdn: {
        label: 'CDN',
        detail: '95% статики отдаются с edge. 5% промахов проходят к origin.',
        capacity: 20000,
        latency: 10,
        short: '95% hit rate',
    },
    storage: {
        label: 'Хранилище',
        detail: 'Origin для файлов: до 1 000 запросов/с.',
        capacity: 1000,
        latency: 80,
        short: '1 000 RPS',
    },
    shard: {
        label: 'Шард-роутер',
        detail: 'Распределяет ключи поровну по разным БД. Один ключ всегда попадает в один шард.',
        capacity: 20000,
        latency: 5,
        short: 'Hash(key)',
    },
}
export const ADDABLE_BLOCKS: BlockKind[] = [
    'api', 'database', 'balancer', 'cache', 'queue', 'worker', 'cdn', 'shard',
    'dedup', 'retry', 'timeout', 'breaker', 'limiter', 'outbox', 'dlq',
    'replication', 'quorum', 'transaction', 'coalescer', 'versioning',
]

const b = (id: string, kind: BlockKind, x: number, y: number): Block => ({ id, kind, x, y })
const wires = (...pairs: [string, string][]): Wire[] =>
    pairs.map(([source, target]) => ({ id: `${source}-${target}`, source, target }))
const standard = (sink: BlockKind = 'database'): Design => ({
    blocks: [b('client', 'client', 30, 140), b('api', 'api', 310, 140), b('sink', sink, 870, 140)],
    wires: wires(['client', 'api'], ['api', 'sink']),
})
export const EXERCISES: Exercise[] = [
    {
        id: 'traffic',
        title: 'Сервис не выдержал запуск',
        topic: 'Горизонтальное масштабирование',
        description:
            'После запуска продукта пришло 1 600 запросов/с. Один API справляется только с 1 000. БД пока достаточно: в этом упражнении её лимит 5 000 запросов/с.',
        incident: 'API перегружен, часть запросов теряется.',
        demand: 1600,
        goal: 'Распределите трафик между минимум двумя API. Каждый запрос должен доходить до БД.',
        hint: 'Поставьте балансировщик перед API. Уберите старую прямую связь клиентов с API и подключите ещё один сервер к общей БД.',
        tradeoff:
            'Реплики API снимают нагрузку с приложения, но не масштабируют общую БД. В реальной системе ещё нужны health checks и отсутствие локального состояния.',
        allowed: [...ADDABLE_BLOCKS],
        initial: standard(),
        sink: 'sink',
    },
    {
        id: 'catalog',
        title: 'Каталог тормозит',
        topic: 'Кеширование чтений',
        description:
            'Каталог получает 800 чтений/с. БД держит 100 чтений/с в этой задаче. Запросы часто повторяются; допустима задержка обновления данных до минуты.',
        incident: 'База перегружена повторяющимися чтениями.',
        demand: 800,
        goal: 'Доведите нагрузку на БД до 100 запросов/с или ниже. Промахи кеша должны доходить до БД.',
        hint: 'Кеш поставьте между API и БД. Удалите прямую связь API → БД, иначе база продолжит получать все запросы.',
        tradeoff:
            '90% попаданий оставляют 80 чтений/с для БД. Холодный кеш и инвалидация требуют отдельного плана; эти условия не входят в нагрузочный сценарий.',
        allowed: [...ADDABLE_BLOCKS],
        initial: standard(),
        sink: 'sink',
    },
    {
        id: 'jobs',
        title: 'Письма блокируют API',
        topic: 'Асинхронная обработка',
        description:
            'За 2 секунды приходит 2 400 запросов на отправку письма. API принимает до 5 000 запросов/с, воркер отправляет 200 писем/с. Можно принять задания сразу и завершить отправку в течение 20 секунд.',
        incident: 'Синхронный путь перегружает воркер.',
        demand: 1200,
        goal: 'Сохраните все 2 400 заданий, отделите отправку от ответа API и уложитесь в 20 секунд.',
        hint: 'Добавьте очередь перед воркером и уберите синхронный обход. Очередь должна вести к воркеру, а воркер — к журналу отправки.',
        tradeoff:
            'Очередь сглаживает всплеск: 2 400 / 200 = 12 секунд обработки. В production нужны повторные доставки, идемпотентность и обработка неисправимых заданий.',
        allowed: [...ADDABLE_BLOCKS],
        initial: {
            blocks: [
                b('client', 'client', 30, 140),
                b('api', 'api', 250, 140),
                b('worker', 'worker', 650, 140),
                b('sink', 'database', 900, 140),
            ],
            wires: wires(['client', 'api'], ['api', 'worker'], ['worker', 'sink']),
        },
        sink: 'sink',
    },
    {
        id: 'media',
        title: 'Изображения перегружают origin',
        topic: 'Доставка статики',
        description:
            '6 000 запросов/с приходят за одинаковыми публичными изображениями. Origin выдерживает 1 000. Для этой задачи edge-кеш прогрет и даёт 95% попаданий.',
        incident: 'API и файловое хранилище не выдерживают трафик.',
        demand: 6000,
        goal: 'Отдавайте статику с edge, оставив origin не больше 1 000 запросов/с. Промахи должны доходить до файлов.',
        hint: 'Поставьте CDN перед API. Удалите прямой путь клиентов к origin. Соедините CDN с API для промахов.',
        tradeoff:
            'На origin останется 300 запросов/с. CDN подходит публичной статике; приватные файлы требуют правил доступа, а обновления — версионирования или инвалидации.',
        allowed: [...ADDABLE_BLOCKS],
        initial: standard('storage'),
        sink: 'sink',
    },
    {
        id: 'shards',
        title: 'Записи упёрлись в одну БД',
        topic: 'Шардирование',
        description:
            '1 600 записей/с равномерно распределены по ключам пользователей. БД держит 1 000 записей/с. API в этой задаче рассчитан на 5 000. Кеш не уменьшает поток записей.',
        incident: 'Единственная база не успевает сохранять записи.',
        demand: 1600,
        goal: 'Разделите пространство ключей минимум между двумя БД. Все записи должны сохраняться.',
        hint: 'Подключите шард-роутер после API и две базы после него. Удалите прямой путь API → БД.',
        tradeoff:
            'Каждому из двух шардов достанется 800 записей/с. Цена решения — ребалансировка ключей и сложные запросы между шардами. Это не репликация.',
        allowed: [...ADDABLE_BLOCKS],
        initial: standard(),
        sink: 'sink',
    },
]

export const TRACKS = [
    'Основы нагрузки',
    'Надёжные запросы',
    'Репликация и согласованность',
    'Доставка событий',
    'Кеш и защита ресурсов',
]
EXERCISES.push({
    id: 'rpc-dedup',
    title: 'Платёж списался дважды',
    track: 'Надёжные запросы',
    topic: 'Идемпотентность RPC',
    description: 'Клиент повторил платёж после потери ответа. Оба запроса имеют один operation ID.',
    incident: 'Без атомарного журнала повтор выполнит списание заново.',
    demand: 100,
    goal: 'Повтор одного ID возвращает тот же результат; списание выполняется один раз.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Дедупликация → БД. Удалите обходные связи.',
    tradeoff:
        'Хранение ключа и результата должно быть атомарно с изменением баланса; срок хранения ограничивает окно защиты.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'dedup', 'database'],
        event: 'Две доставки одного operation ID.',
        success: 'Повтор найден в журнале результатов: один эффект, два одинаковых ответа.',
        failure: 'Без атомарного журнала повтор выполнит списание заново.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'rpc-retry',
    title: 'Пакет потерялся в сети',
    track: 'Надёжные запросы',
    topic: 'Ограниченные повторы',
    description: 'Первая отправка записи теряется. Вторая доходит, но её ответ может потеряться.',
    incident:
        'Без таймаута запрос зависнет; без повторов потеряется; без дедупликации возможен двойной эффект.',
    demand: 100,
    goal: 'Ограничьте ожидание, повторите временный сбой и защитите запись от повторного эффекта.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Повторы с backoff → Таймаут → Дедупликация → БД. Удалите обходные связи.',
    tradeoff:
        'Backoff ограничивает повторную нагрузку. Таймаут не доказывает, что удалённая операция не была выполнена.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'retry', 'timeout', 'dedup', 'database'],
        event: 'Первая доставка потеряна; ответ на вторую тоже потерян.',
        success:
            'Таймаут завершает ожидание; повтор с тем же ID возвращает единственный сохранённый результат.',
        failure:
            'Без таймаута запрос зависнет; без повторов потеряется; без дедупликации возможен двойной эффект.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'dependency-timeout',
    title: 'Зависимость зависла',
    track: 'Надёжные запросы',
    topic: 'Ограничение ожидания',
    description: 'Сервис профилей перестал отвечать. Нужно ограничить ожидание одного обращения 200 мс.',
    incident: 'Вызов продолжает занимать слот API без ограничения времени.',
    demand: 100,
    goal: 'Поставьте границу ожидания перед зависимостью; кеш не задаёт таймаут.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Таймаут → БД. Удалите обходные связи.',
    tradeoff: 'Отмена ожидания не отменяет работу сервера; для записи нужен operation ID.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'timeout', 'database'],
        event: 'Зависимость не отвечает дольше 200 мс.',
        success: 'Ожидание прервано по таймауту; слот API освобождён.',
        failure: 'Вызов продолжает занимать слот API без ограничения времени.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'retry-storm',
    title: 'Повторы устроили лавину',
    track: 'Надёжные запросы',
    topic: 'Бюджет повторов',
    description:
        'Зависимость возвращает временные ошибки сериями. Бесконечные немедленные повторы усугубляют отказ.',
    incident: 'Повторы продолжают давить на неисправную зависимость.',
    demand: 100,
    goal: 'Ограничьте ожидание и число попыток; открытый breaker должен остановить новые серии повторов.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Circuit breaker → Повторы с backoff → Таймаут → Дедупликация → БД. Удалите обходные связи.',
    tradeoff:
        'Breaker располагается перед политикой повторов и считает итог серии. Jitter рассинхронизирует клиентов.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'breaker', 'retry', 'timeout', 'dedup', 'database'],
        event: 'Три последовательных ошибки зависимости.',
        success: 'Бюджет серии исчерпан; breaker блокирует новые серии до пробного запроса.',
        failure: 'Повторы продолжают давить на неисправную зависимость.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'edge-admission',
    title: 'Один клиент занял весь API',
    track: 'Надёжные запросы',
    topic: 'Контроль входящего потока',
    description: 'Приходит 1 600 запросов/с. Допустимо явно отклонять избыток, сохранив до 500 запросов/с.',
    incident: 'Без входного лимитера API перегружен.',
    demand: 1600,
    goal: 'Ограничьте поток до API, возвращая 429 вместо перегрузки.',
    hint: 'Расположите компоненты по порядку: Клиенты → Rate limiter → API → БД. Удалите обходные связи.',
    tradeoff: 'Клиент должен учитывать Retry-After. Лимитер требует правил справедливости по пользователям.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['limiter', 'api', 'database'],
        event: 'Поток 1 600 запросов/с превышает бюджет 500.',
        success: 'Принято 500 запросов/с; 1 100 получают 429 до API.',
        failure: 'Без входного лимитера API перегружен.',
        limits: {},
        admitted: 500,
    },
})
EXERCISES.push({
    id: 'leader-crash',
    title: 'Лидер упал после ACK',
    track: 'Репликация и согласованность',
    topic: 'Primary-backup',
    description:
        'Лидер подтверждает запись и сразу выходит из строя. Подтверждённые данные должны пережить один отказ.',
    incident: 'Подтверждённая запись остаётся только на отказавшем узле.',
    demand: 100,
    goal: 'Подтверждайте запись только после синхронного backup.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Primary / backup → БД. Удалите обходные связи.',
    tradeoff:
        'Синхронный backup увеличивает задержку ACK. При потере связи требуется безопасный выбор нового primary.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'replication', 'database'],
        event: 'Primary падает сразу после подтверждения записи.',
        success: 'Backup содержит подтверждённую запись и становится новым primary с новым epoch.',
        failure: 'Подтверждённая запись остаётся только на отказавшем узле.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'split-brain',
    title: 'Два лидера после разделения сети',
    track: 'Репликация и согласованность',
    topic: 'Большинство и fencing',
    description: 'Сеть разделила три узла на группы 2 и 1. Обе стороны пытаются принять новую запись.',
    incident: 'Без большинства обе стороны могут подтвердить несовместимые записи.',
    demand: 100,
    goal: 'Разрешайте запись только большинству, меньшинство должно отказать.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Группа консенсуса → БД. Удалите обходные связи.',
    tradeoff:
        'Сохраняем согласованность, жертвуя доступностью меньшинства; кворумный блок включает журнал и выбор лидера.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'quorum', 'database'],
        event: 'Разделение сети: 2 узла против 1.',
        success: 'Группа из двух подтверждает запись; одиночный участник не получает кворум.',
        failure: 'Без большинства обе стороны могут подтвердить несовместимые записи.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'read-own-write',
    title: 'Пользователь не видит свой ответ',
    track: 'Репликация и согласованность',
    topic: 'Read-your-writes',
    description:
        'После сохранения профиль читается через устаревший кеш. Версия ответа должна быть не ниже версии записи.',
    incident: 'Без барьера версий старое значение может заменить новое.',
    demand: 100,
    goal: 'Подтвердите репликацию до публикации новой версии и инвалидируйте старое значение.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Primary / backup → Версии и инвалидация → БД. Удалите обходные связи.',
    tradeoff:
        'Session token или чтение с лидера дают альтернативу. Глобальная линейризуемость не следует из одного session token.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'replication', 'versioning', 'database'],
        event: 'Записана версия 8, из кеша приходит версия 7.',
        success: 'После ACK опубликована версия 8; значение версии 7 отклонено.',
        failure: 'Без барьера версий старое значение может заменить новое.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'ordered-events',
    title: 'События приехали не по порядку',
    track: 'Репликация и согласованность',
    topic: 'Монотонные обновления',
    description:
        'Обновления одного объекта доставлены в порядке 12, 10, 11. Нельзя откатить объект к старой версии.',
    incident: 'Без сравнения версий состояние откатывается назад.',
    demand: 100,
    goal: 'Сравнивайте версии перед изменением состояния.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Версии и инвалидация → БД. Удалите обходные связи.',
    tradeoff:
        'Номер версии должен назначаться авторитетным источником. Время часов разных серверов не заменяет порядок версий.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'versioning', 'database'],
        event: 'После версии 12 доставлены версии 10 и 11.',
        success: 'Версии 10 и 11 отклонены; сохранена версия 12.',
        failure: 'Без сравнения версий состояние откатывается назад.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'durable-retry',
    title: 'ACK потерялся при смене лидера',
    track: 'Репликация и согласованность',
    topic: 'Повтор после failover',
    description:
        'Запись реплицирована, но ответ потерялся. После failover клиент повторяет тот же operation ID.',
    incident: 'Без дедупликации или репликации журнала повтор не защищён.',
    demand: 100,
    goal: 'Повтор должен найти журнал результата на новой реплике, а не выполнить запись снова.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Повторы с backoff → Таймаут → Дедупликация → Primary / backup → БД. Удалите обходные связи.',
    tradeoff:
        'Журнал дедупликации — часть реплицируемого состояния. Хранить его только в памяти API недостаточно.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'retry', 'timeout', 'dedup', 'replication', 'database'],
        event: 'ACK потерян; primary отказал; запрос повторён.',
        success: 'Журнал ID реплицирован вместе с результатом; новый лидер возвращает прежний ответ.',
        failure: 'Без дедупликации или репликации журнала повтор не защищён.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'event-gap',
    title: 'Заказ есть, события нет',
    track: 'Доставка событий',
    topic: 'Transactional outbox',
    description: 'Процесс упал между записью заказа и публикацией события. Событие не должно потеряться.',
    incident: 'Отдельные запись и публикация оставляют окно потери события.',
    demand: 100,
    goal: 'Сохраните событие с изменением атомарно и передайте его через очередь воркеру.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Transactional outbox → Очередь → Воркер → БД. Удалите обходные связи.',
    tradeoff:
        'Relay может отправить событие повторно. Потребитель должен быть идемпотентным; outbox не означает exactly-once доставку.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'outbox', 'queue', 'worker', 'database'],
        event: 'Сбой после локального commit, до публикации.',
        success: 'Событие осталось в outbox; relay повторяет публикацию после восстановления.',
        failure: 'Отдельные запись и публикация оставляют окно потери события.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'consumer-redelivery',
    title: 'Событие применилось дважды',
    track: 'Доставка событий',
    topic: 'Идемпотентный потребитель',
    description: 'Воркер изменил запись в БД, но упал до ACK очереди. Сообщение доставлено ещё раз.',
    incident: 'Очередь повторит доставку и эффект выполнится дважды.',
    demand: 100,
    goal: 'Поставьте проверку event ID перед записью эффекта.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Очередь → Воркер → Дедупликация → БД. Удалите обходные связи.',
    tradeoff:
        'Для внешних эффектов вроде почты нужна идемпотентность провайдера или отдельный согласованный протокол.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'queue', 'worker', 'dedup', 'database'],
        event: 'Повторная доставка после потери consumer ACK.',
        success: 'Event ID уже обработан; повтор подтверждён без второго эффекта.',
        failure: 'Очередь повторит доставку и эффект выполнится дважды.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'poison-message',
    title: 'Одно сообщение остановило очередь',
    track: 'Доставка событий',
    topic: 'Карантин ошибок',
    description:
        'Неисправимое сообщение всегда падает; бесконечные повторные доставки блокируют следующие задания.',
    incident: 'Без ограниченного карантина сообщение повторяется бесконечно.',
    demand: 100,
    goal: 'После трёх неудач изолируйте сообщение, сохранив возможность разобрать его позже.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Очередь → DLQ-политика → Воркер → БД. Удалите обходные связи.',
    tradeoff:
        'DLQ нужно мониторить и разбирать. Повторный запуск после исправления ошибки должен сохранять исходный event ID.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'queue', 'dlq', 'worker', 'database'],
        event: 'Одно сообщение завершает три обработки ошибкой.',
        success: 'Сообщение помещено в карантин; последующие задания продолжают обработку.',
        failure: 'Без ограниченного карантина сообщение повторяется бесконечно.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'webhook-retries',
    title: 'Webhook временно недоступен',
    track: 'Доставка событий',
    topic: 'Доставка с повтором',
    description:
        'Получатель webhook вернул 503, затем восстановился. Потерять событие или продублировать эффект нельзя.',
    incident: 'Без повтора событие потеряется; без ID возможен дубль.',
    demand: 100,
    goal: 'Ограничьте вызов по времени, повторите временную ошибку с тем же ID.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Очередь → Воркер → Повторы с backoff → Таймаут → Дедупликация → БД. Удалите обходные связи.',
    tradeoff:
        'Повторять стоит временные ошибки и 429 с Retry-After; постоянные ошибки направляют в карантин.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'queue', 'worker', 'retry', 'timeout', 'dedup', 'database'],
        event: 'Первая попытка 503, следующая успешна, ответ потерян.',
        success: 'Ограниченный повтор с тем же ID завершается единственным эффектом.',
        failure: 'Без повтора событие потеряется; без ID возможен дубль.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'atomic-transfer',
    title: 'Деньги ушли только с одного счёта',
    track: 'Доставка событий',
    topic: 'Межшардная транзакция',
    description:
        'Два участника перевода находятся в разных шардах. Один голосует prepare=no. В блоке БД представлены оба участника.',
    incident: 'Без общего решения возможен частичный перевод.',
    demand: 100,
    goal: 'Координатор должен собрать prepare и принять общее решение перед commit.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Координатор 2PC → БД. Удалите обходные связи.',
    tradeoff:
        '2PC может блокировать участников при отказе координатора. Долговечный журнал и восстановление обязательны; saga подходит не для всех инвариантов.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'transaction', 'database'],
        event: 'Первый участник готов, второй отвечает prepare=no.',
        success: 'Координатор журналирует abort; оба участника отменяют изменения.',
        failure: 'Без общего решения возможен частичный перевод.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'hot-key',
    title: 'Популярный ключ перегрузил БД',
    track: 'Кеш и защита ресурсов',
    topic: 'Объединение чтений',
    description:
        '800 одновременных чтений одного ключа проходят через холодный кеш. БД выдерживает 100 запросов/с.',
    incident: 'Все 800 чтений доходят до БД одновременно.',
    demand: 800,
    goal: 'Объедините одновременные запросы одного ключа; простое добавление кеша не спасает первый промах.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Single-flight → БД. Удалите обходные связи.',
    tradeoff: 'Single-flight нужен на общем для запросов участке. Для разных ключей нагрузка не уменьшается.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'coalescer', 'database'],
        event: '800 одновременных чтений одного и того же ключа.',
        success: 'Один запрос читает значение; остальные ожидают его результат.',
        failure: 'Все 800 чтений доходят до БД одновременно.',
        limits: { database: 100 },
    },
})
EXERCISES.push({
    id: 'stale-cache',
    title: 'Старый ответ затёр новый кеш',
    track: 'Кеш и защита ресурсов',
    topic: 'Гонка инвалидации',
    description:
        'Медленное чтение версии 4 завершается после записи версии 5 и пытается снова наполнить кеш.',
    incident: 'Одна инвалидация не остановит позднюю запись старого значения.',
    demand: 100,
    goal: 'Отбрасывайте старую версию перед заполнением кеша.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Версии и инвалидация → Кеш → БД. Удалите обходные связи.',
    tradeoff:
        'Атомарный compare-and-set и версия tombstone защищают от позднего refill; один TTL только ограничивает время ошибки.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'versioning', 'cache', 'database'],
        event: 'Версия 5 подтверждена; задержанный ответ содержит версию 4.',
        success: 'Сравнение версий запрещает публикацию версии 4.',
        failure: 'Одна инвалидация не остановит позднюю запись старого значения.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'cache-stampede',
    title: 'Кеш истёк у всех одновременно',
    track: 'Кеш и защита ресурсов',
    topic: 'Cache stampede',
    description:
        'TTL популярного ключа истёк. 800 клиентов одновременно хотят обновить значение. БД рассчитана на 100 запросов/с.',
    incident: 'Прогретый hit rate не защищает от одновременного истечения TTL.',
    demand: 800,
    goal: 'Сериализуйте заполнение одного ключа перед кешем, сохранив путь промаха к БД.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Single-flight → Кеш → БД. Удалите обходные связи.',
    tradeoff:
        'Jitter TTL, stale-while-revalidate и раннее обновление дополняют single-flight, но требуют правил допустимой свежести.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'coalescer', 'cache', 'database'],
        event: '800 одновременных промахов для одного ключа.',
        success: 'Только владелец single-flight заполняет кеш; остальные получают его результат.',
        failure: 'Прогретый hit rate не защищает от одновременного истечения TTL.',
        limits: { database: 100 },
    },
})
EXERCISES.push({
    id: 'dependency-isolation',
    title: 'Чужой сбой съел ресурсы API',
    track: 'Кеш и защита ресурсов',
    topic: 'Fail-fast для зависимости',
    description:
        'Зависимость долго отвечает и стабильно падает. Новые обращения должны быстро отказываться после серии ошибок.',
    incident: 'Таймаут без breaker продолжает расходовать ресурсы на каждый новый запрос.',
    demand: 100,
    goal: 'Ограничьте один вызов и остановите обращения к неисправной зависимости.',
    hint: 'Расположите компоненты по порядку: Клиенты → API → Circuit breaker → Таймаут → БД. Удалите обходные связи.',
    tradeoff:
        'Breaker не заменяет отдельный пул потоков и лимит concurrency. Клиенту нужен понятный ответ о временной недоступности.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['api', 'breaker', 'timeout', 'database'],
        event: 'Серия таймаутов открывает breaker.',
        success: 'Новые обращения получают быстрый отказ; half-open допускает один пробный вызов.',
        failure: 'Таймаут без breaker продолжает расходовать ресурсы на каждый новый запрос.',
        limits: {},
    },
})
EXERCISES.push({
    id: 'protected-writes',
    title: 'Всплеск записи после восстановления',
    track: 'Кеш и защита ресурсов',
    topic: 'Admission и безопасный повтор',
    description: 'После восстановления 1 600 запросов/с повторяют операции записи. Бюджет приёма — 500/с.',
    incident: 'Без admission возникает перегрузка, без ID — повторный эффект.',
    demand: 1600,
    goal: 'Сначала ограничьте вход; затем ограничьте ожидание и безопасно повторите принятые операции.',
    hint: 'Расположите компоненты по порядку: Клиенты → Rate limiter → API → Повторы с backoff → Таймаут → Дедупликация → БД. Удалите обходные связи.',
    tradeoff:
        'Бюджет ограничивает новые операции, а повторные попытки тоже требуют отдельного лимита. Не держите очередь повторов бесконечной.',
    allowed: [...ADDABLE_BLOCKS],
    initial: standard(),
    sink: 'sink',
    scenario: {
        route: ['limiter', 'api', 'retry', 'timeout', 'dedup', 'database'],
        event: 'Вход 1 600/с, первая попытка принятой записи теряет ответ.',
        success: '1 100/с получают 429; повтор принятых ID не дублирует записи.',
        failure: 'Без admission возникает перегрузка, без ID — повторный эффект.',
        limits: {},
        admitted: 500,
    },
})

/** Existing infrastructure is part of each incident, not something the learner must rebuild. */
const infrastructure: Record<string, BlockKind[]> = {
    'retry-storm': ['retry'],
    'read-own-write': ['replication'],
    'durable-retry': ['replication'],
    'event-gap': ['worker'],
    'consumer-redelivery': ['queue', 'worker'],
    'poison-message': ['queue', 'worker'],
    'webhook-retries': ['queue', 'worker'],
    'stale-cache': ['cache'],
    'cache-stampede': ['cache'],
    'protected-writes': ['retry'],
}
for (const ex of EXERCISES) {
    const existing = infrastructure[ex.id]
    if (!existing) continue
    const nodes: Block[] = [
        b('client', 'client', 30, 140),
        b('api', 'api', 295, 140),
        ...existing.map((kind, i) => b(`existing-${kind}`, kind, 560 + i * 265, 140)),
        b('sink', 'database', 560 + existing.length * 265, 140),
    ]
    ex.initial = {
        blocks: nodes,
        wires: wires(...nodes.slice(1).map((n, i): [string, string] => [nodes[i].id, n.id])),
    }
}

export function cloneDesign(design: Design): Design {
    return JSON.parse(JSON.stringify(design))
}
export function capacity(ex: Exercise, block: Block): number {
    if (ex.scenario?.limits?.[block.kind] !== undefined) return ex.scenario.limits[block.kind]!
    if (ex.id === 'traffic' && block.kind === 'database') return 5000
    if (ex.id === 'catalog' && block.kind === 'database') return 100
    if ((ex.id === 'shards' || ex.id === 'jobs') && block.kind === 'api') return 5000
    return PARTS[block.kind].capacity
}
export function wouldCycle(design: Design, source: string, target: string): boolean {
    const seen = new Set<string>()
    const visit = (id: string): boolean => {
        if (id === source) return true
        if (seen.has(id)) return false
        seen.add(id)
        return design.wires.some((w) => w.source === id && visit(w.target))
    }
    return visit(target)
}
export interface Check {
    label: string
    ok: boolean
    detail: string
}
export interface Evaluation {
    passed: boolean
    checks: Check[]
    loads: Record<string, number>
    overloaded: string[]
    trace: string[]
    latency: number
    drain?: number
}
export function evaluate(ex: Exercise, design: Design): Evaluation {
    const map = new Map(design.blocks.map((n) => [n.id, n]))
    const out = (id: string) =>
        design.wires
            .filter((e) => e.source === id)
            .map((e) => map.get(e.target)!)
            .filter(Boolean)
    const checks: Check[] = []
    const add = (label: string, ok: boolean, detail: string) => checks.push({ label, ok, detail })
    const intact = ex.initial.blocks.every((n) => map.get(n.id)?.kind === n.kind)
    const validEdges =
        design.wires.every((w) => map.has(w.source) && map.has(w.target) && w.source !== w.target) &&
        new Set(design.wires.map((w) => `${w.source}>${w.target}`)).size === design.wires.length
    const acyclic =
        validEdges &&
        design.wires.every(
            (w) =>
                !wouldCycle(
                    { ...design, wires: design.wires.filter((e) => e.id !== w.id) },
                    w.source,
                    w.target,
                ),
        )
    add(
        'Целостность схемы',
        intact && acyclic,
        'Обязательные компоненты сохранены; нет циклов, дубликатов и оборванных связей.',
    )
    const reachable = new Set<string>()
    const visit = (id: string) => {
        if (reachable.has(id)) return
        reachable.add(id)
        out(id).forEach((n) => visit(n.id))
    }
    visit('client')
    const terminals = [...reachable].filter((id) => out(id).length === 0)
    const sinkKinds =
        ex.id === 'shards' ? design.blocks.filter((n) => n.kind === 'database').map((n) => n.id) : [ex.sink]
    const reachesEnd =
        terminals.length > 0 && terminals.every((id) => sinkKinds.includes(id)) && reachable.has(ex.sink)
    const safeFanout = [...reachable].every((id) => {
        const kind = map.get(id)?.kind
        return out(id).length <= 1 || kind === 'balancer' || kind === 'shard'
    })
    add(
        'Маршруты без потерь и дублей',
        reachesEnd && safeFanout,
        'Каждая ветка ведёт к хранилищу. Делить поток могут балансировщик и шард-роутер; обычная развилка дублирует запросы.',
    )
    const active = design.blocks.filter((n) => reachable.has(n.id))
    const byKind = (kind: BlockKind) => active.filter((n) => n.kind === kind)
    let architecture = false
    if (ex.id === 'traffic')
        architecture =
            out('client').length === 1 &&
            out('client')[0].kind === 'balancer' &&
            byKind('balancer').some(
                (n) =>
                    out(n.id).filter((n) => n.kind === 'api').length >= 2 &&
                    out(n.id).every((n) => n.kind === 'api'),
            )
    if (ex.id === 'catalog')
        architecture =
            out('api').length === 1 &&
            out('api')[0].kind === 'cache' &&
            out(out('api')[0].id).some((n) => n.id === ex.sink)
    if (ex.id === 'jobs')
        architecture =
            out('api').length === 1 &&
            out('api')[0].kind === 'queue' &&
            out(out('api')[0].id).length === 1 &&
            out(out('api')[0].id)[0].id === 'worker'
    if (ex.id === 'media')
        architecture =
            out('client').length === 1 &&
            out('client')[0].kind === 'cdn' &&
            out(out('client')[0].id).some((n) => n.id === 'api')
    if (ex.id === 'shards')
        architecture =
            out('api').length === 1 &&
            out('api')[0].kind === 'shard' &&
            out(out('api')[0].id).filter((n) => n.kind === 'database').length >= 2 &&
            out(out('api')[0].id).every((n) => n.kind === 'database') &&
            byKind('cache').length === 0
    if (ex.scenario && acyclic) {
        // A path automaton checks EVERY route, including merges and bypasses. Merely placing
        // the right kinds somewhere on the board never satisfies a scenario invariant.
        const route = ex.scenario.route
        const memo = new Map<string, boolean>()
        const follows = (id: string, step: number): boolean => {
            const key = `${id}:${step}`
            if (memo.has(key)) return memo.get(key)!
            const kind = map.get(id)?.kind
            const next = kind === route[step] ? step + 1 : step
            const children = out(id)
            const ok = children.length
                ? children.every((n) => follows(n.id, next))
                : id === ex.sink && next === route.length
            memo.set(key, ok)
            return ok
        }
        architecture = follows('client', 0)
        add(
            'Сценарий отказа',
            architecture,
            `${ex.scenario.event} ${architecture ? ex.scenario.success : ex.scenario.failure}`,
        )
    }
    add('Исправлена причина сбоя', architecture, ex.goal)
    // A topological pass accumulates every incoming branch before calculating outgoing load.
    const loads: Record<string, number> = { client: ex.demand }
    const latency: Record<string, number> = { client: 0 }
    const indegrees = Object.fromEntries(
        active.map((n) => [
            n.id,
            design.wires.filter((w) => w.target === n.id && reachable.has(w.source)).length,
        ]),
    )
    const queue = active.filter((n) => indegrees[n.id] === 0)
    const ordered: Block[] = []
    if (acyclic)
        while (queue.length) {
            const node = queue.shift()!
            ordered.push(node)
            const children = out(node.id)
            const rate = loads[node.id] || 0
            let factor =
                node.kind === 'cache' && ex.id === 'catalog'
                    ? 0.1
                    : node.kind === 'cdn' && ex.id === 'media'
                      ? 0.05
                      : node.kind === 'queue'
                        ? rate > 0
                            ? Math.min(1, PARTS.worker.capacity / rate)
                            : 0
                        : 1
            if (ex.scenario?.admitted && node.kind === 'limiter')
                factor = rate > 0 ? Math.min(1, ex.scenario.admitted / rate) : 0
            if (ex.scenario && node.kind === 'coalescer' && ['hot-key', 'cache-stampede'].includes(ex.id))
                factor = rate > 0 ? 1 / rate : 0
            if (node.kind === 'balancer' || node.kind === 'shard') factor /= Math.max(1, children.length)
            for (const child of children) {
                loads[child.id] = (loads[child.id] || 0) + rate * factor
                latency[child.id] = Math.max(
                    latency[child.id] || 0,
                    node.kind === 'queue' ? 0 : (latency[node.id] || 0) + PARTS[node.kind].latency,
                )
                if (--indegrees[child.id] === 0) queue.push(child)
            }
        }
    const overloaded = active.filter((n) => (loads[n.id] || 0) > capacity(ex, n)).map((n) => n.id)
    const drain =
        ex.id === 'jobs' && byKind('queue').length ? (ex.demand * 2) / PARTS.worker.capacity : undefined
    const withinCapacity = acyclic && overloaded.length === 0 && (drain === undefined || drain <= 20)
    add(
        'Нагрузка в пределах лимитов',
        withinCapacity,
        drain !== undefined
            ? `Всплеск: ${ex.demand * 2} заданий. Обработка: ${drain} с из допустимых 20 с.`
            : overloaded.length
              ? overloaded
                    .map(
                        (id) =>
                            `${PARTS[map.get(id)!.kind].label}: ${Math.round(loads[id])} > ${capacity(ex, map.get(id)!)}`,
                    )
                    .join('; ')
              : 'Все достижимые компоненты выдерживают заданный поток.',
    )
    add(
        'Нет неиспользуемых блоков',
        active.length === design.blocks.length,
        'Каждый добавленный блок должен участвовать в пути запроса.',
    )
    const trace = (acyclic ? ordered : active).map((n) => {
        const peers = active.filter((b) => b.kind === n.kind)
        const suffix = peers.length > 1 ? ` ${peers.findIndex((b) => b.id === n.id) + 1}` : ''
        return `${PARTS[n.kind].label}${suffix}: ${Math.round(loads[n.id] || 0).toLocaleString('ru-RU')} запросов/с${overloaded.includes(n.id) ? ' — перегрузка' : ''}`
    })
    if (ex.scenario) trace.push(ex.scenario.event, architecture ? ex.scenario.success : ex.scenario.failure)
    return {
        passed: checks.every((c) => c.ok),
        checks,
        loads,
        overloaded,
        trace,
        latency:
            ex.id === 'jobs' && byKind('queue').length
                ? PARTS.api.latency + PARTS.queue.latency
                : Math.max(0, ...active.map((n) => (latency[n.id] || 0) + PARTS[n.kind].latency)),
        drain,
    }
}
export function restoreDesign(value: unknown, ex: Exercise): Design | null {
    if (!value || typeof value !== 'object') return null
    const d = value as Design
    if (!Array.isArray(d.blocks) || !Array.isArray(d.wires) || d.blocks.length > 30 || d.wires.length > 80)
        return null
    if (
        !d.blocks.every(
            (n) =>
                n &&
                typeof n.id === 'string' &&
                n.id.length < 100 &&
                Object.prototype.hasOwnProperty.call(PARTS, n.kind) &&
                Number.isFinite(n.x) &&
                Number.isFinite(n.y) &&
                Math.abs(n.x) < 10000 &&
                Math.abs(n.y) < 10000,
        )
    )
        return null
    if (new Set(d.blocks.map((n) => n.id)).size !== d.blocks.length) return null
    if (!ex.initial.blocks.every((n) => d.blocks.some((b) => b.id === n.id && b.kind === n.kind))) return null
    if (d.blocks.some((n) => !ex.initial.blocks.some((b) => b.id === n.id) && !ex.allowed.includes(n.kind)))
        return null
    if (new Set(d.wires.map((w) => w?.id)).size !== d.wires.length) return null
    if (
        !d.wires.every(
            (w) =>
                w &&
                typeof w.id === 'string' &&
                typeof w.source === 'string' &&
                typeof w.target === 'string' &&
                d.blocks.some((n) => n.id === w.source) &&
                d.blocks.some((n) => n.id === w.target),
        )
    )
        return null
    return cloneDesign(d)
}
/** Lay out a DAG without changing its topology or scoring. Unconnected blocks go in their own column. */
export function arrange(design: Design): Design {
    const depth = new Map<string, number>([['client', 0]])
    for (let pass = 0; pass < design.blocks.length; pass++)
        for (const wire of design.wires) {
            const sourceDepth = depth.get(wire.source)
            if (sourceDepth !== undefined)
                depth.set(
                    wire.target,
                    Math.min(design.blocks.length, Math.max(depth.get(wire.target) || 0, sourceDepth + 1)),
                )
        }
    const last = Math.max(0, ...depth.values()) + 1
    const columns = new Map<number, string[]>()
    for (const node of design.blocks) {
        const col = depth.get(node.id) ?? last
        columns.set(col, [...(columns.get(col) || []), node.id])
    }
    return {
        ...cloneDesign(design),
        blocks: design.blocks.map((n) => {
            const col = depth.get(n.id) ?? last
            const ids = columns.get(col)!
            return { ...n, x: 30 + col * 265, y: 210 + (ids.indexOf(n.id) - (ids.length - 1) / 2) * 145 }
        }),
    }
}

/** Insert or move a simple inline component in one atomic, undoable graph operation. */
export function insertBlockOnWire(design: Design, block: Block, wireId: string): Design | null {
    const wire = design.wires.find((w) => w.id === wireId)
    if (
        !wire ||
        wire.source === block.id ||
        wire.target === block.id ||
        block.kind === 'client' ||
        block.kind === 'storage'
    )
        return null
    const existing = design.blocks.some((n) => n.id === block.id)
    const incoming = design.wires.filter((w) => w.target === block.id)
    const outgoing = design.wires.filter((w) => w.source === block.id)
    if (
        existing &&
        !(
            (incoming.length === 0 && outgoing.length === 0) ||
            (incoming.length === 1 && outgoing.length === 1)
        )
    )
        return null
    let wires = design.wires.filter((w) => w.id !== wireId && w.source !== block.id && w.target !== block.id)
    const blocks = existing
        ? design.blocks.map((n) => (n.id === block.id ? { ...block } : { ...n }))
        : [...design.blocks.map((n) => ({ ...n })), { ...block }]
    if (
        incoming.length === 1 &&
        outgoing.length === 1 &&
        !wires.some((w) => w.source === incoming[0].source && w.target === outgoing[0].target)
    ) {
        wires.push({
            id: `bridge:${block.id}:${wireId}`,
            source: incoming[0].source,
            target: outgoing[0].target,
        })
    }
    wires = [
        ...wires,
        { id: `in:${block.id}:${wireId}`, source: wire.source, target: block.id },
        { id: `out:${block.id}:${wireId}`, source: block.id, target: wire.target },
    ]
    const next = { blocks, wires }
    if (
        wires.some((w) =>
            wouldCycle({ ...next, wires: wires.filter((e) => e.id !== w.id) }, w.source, w.target),
        )
    )
        return null
    // Make room locally rather than rearranging the entire board after insertion.
    const from = blocks.find((n) => n.id === wire.source)!,
        to = blocks.find((n) => n.id === wire.target)!,
        inserted = blocks.find((n) => n.id === block.id)!
    if (to.x >= from.x) {
        inserted.x = Math.max(inserted.x, from.x + 265)
        const shift = Math.max(0, inserted.x + 265 - to.x)
        if (shift) {
            const downstream = new Set<string>()
            const visit = (id: string) => {
                if (downstream.has(id) || id === block.id) return
                downstream.add(id)
                wires.filter((w) => w.source === id).forEach((w) => visit(w.target))
            }
            visit(to.id)
            blocks.forEach((n) => {
                if (downstream.has(n.id)) n.x += shift
            })
        }
    }
    return next
}

/** Removing a simple inline block restores its old route; branching blocks need explicit rewiring. */
export function removeDesignBlock(design: Design, id: string): Design {
    const incoming = design.wires.filter((w) => w.target === id),
        outgoing = design.wires.filter((w) => w.source === id)
    const next = {
        blocks: design.blocks.filter((n) => n.id !== id),
        wires: design.wires.filter((w) => w.source !== id && w.target !== id),
    }
    if (incoming.length === 1 && outgoing.length === 1) {
        const source = incoming[0].source,
            target = outgoing[0].target
        if (
            source !== target &&
            !next.wires.some((w) => w.source === source && w.target === target) &&
            !wouldCycle(next, source, target)
        )
            next.wires.push({ id: `restore:${id}`, source, target })
    }
    return next
}
