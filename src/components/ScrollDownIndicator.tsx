import { smoothScrollToElement } from '../lib/smoothScroll'

interface ScrollDownIndicatorProps {
    targetId: string
}

export default function ScrollDownIndicator({ targetId }: ScrollDownIndicatorProps) {
    const scrollToTarget = () => {
        const target = document.getElementById(targetId)
        if (target) smoothScrollToElement(target, { block: 'start' })
    }

    return (
        <button
            type="button"
            onClick={scrollToTarget}
            aria-label="Прокрутить к следующему блоку"
            className="hero-scroll-indicator text-gray-500 transition-iv hover:text-inter-verse-green dark:hover:text-purple-400"
        >
            <svg
                width="26"
                height="38"
                viewBox="0 0 26 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
            >
                <line
                    x1="13"
                    y1="4"
                    x2="13"
                    y2="22"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeLinecap="square"
                />
                <line
                    x1="6"
                    y1="22"
                    x2="13"
                    y2="29"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeLinecap="square"
                />
                <line
                    x1="20"
                    y1="22"
                    x2="13"
                    y2="29"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeLinecap="square"
                />
            </svg>
        </button>
    )
}
