const {
    StyledComponent,
} = Torus;

class DemoView extends StyledComponent {

    init() {
        this.opacity = new AnimatedValue({
            start: 1,
            end: 0,
        });
        this.xPosition = new AnimatedValue({
            start: 0,
            end: 300,
        });
        this.slideOut = AnimatedValue.compose(
            this.opacity,
            this.xPosition
        );

        this.handleStartClick = this.handleStartClick.bind(this);
        this.handleResetClick = this.handleResetClick.bind(this);
        this.handlePauseClick = this.handlePauseClick.bind(this);
        this.handleResumeClick = this.handleResumeClick.bind(this);
    }

    styles() {
        return {
            'font-family': 'sans-serif',
            '.box': {
                'height': '100px',
                'width': '100px',
                'background': 'turquoise',
            },
        }
    }

    handleStartClick() {
        this.slideOut.play(1000, (val) => this.render(val));
    }

    handleResetClick() {
        this.slideOut.reset();
        this.render();
    }

    handlePauseClick() {
        this.slideOut.pause();
    }

    handleResumeClick() {
        this.slideOut.resume();
    }

    compose(val) {
        console.log('rendering', val);
        return jdom`<main>
            <h1>Click the button below to start the animation</h1>
            <button class="startButton" onclick="${this.handleStartClick}">
                Start animation
            </button>
            <button class="pauseButton" onclick="${this.handlePauseClick}">
                Pause animation
            </button>
            <button class="resumeButton" onclick="${this.handleResumeClick}">
                Resume animation
            </button>
            <button class="resetButton" onclick="${this.handleResetClick}">
                Reset animation
            </button>
            <div class="box" style="
                opacity: ${this.opacity.value()};
                transform: translateX(${this.xPosition.value()}px)
            "></div>
        </main>`;
    }

}

const demoView = new DemoView();
document.body.appendChild(demoView.node);
