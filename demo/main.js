const {
    StyledComponent,
} = Torus;

class DemoView extends StyledComponent {

    init() {
        this.opacity = new AnimatedValue({
            start: .2,
            end: 1,
        });
        this.xPosition = new AnimatedValue({
            start: 0,
            end: 300,
            ease: AnimatedValue.CURVES.EASE_OUT_BACK,
        });
        this.yPosition = new AnimatedValue({
            start: 0,
            end: 200,
            ease: AnimatedValue.CURVES.EXPO_OUT,
        });
        this.scale = new AnimatedValue({
            start: 1,
            end: 1.3,
            ease: AnimatedValue.CURVES.EXPO_OUT,
        });
        this.angle = new AnimatedValue({
            start: 300,
            end: 0,
            ease: AnimatedValue.CURVES.EASE_OUT_BACK,
        });
        this.slideOut = AnimatedValue.compose(
            this.opacity,
            this.xPosition,
            this.yPosition,
            this.scale,
            this.angle,
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
                'box-shadow': '0 2px 6px -1px rgba(0, 0, 0, .3)',
                'border-radius': '4px',
            },
        }
    }

    handleStartClick() {
        this.slideOut.play(800, () => this.render()).then(result => {
            console.log('Animation resolved to:', result);
        });
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

    compose() {
        console.log('rendering');
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
                transform: translate(${this.xPosition.value()}px, ${this.yPosition.value()}px)
                    scale(${this.scale.value()}) rotate(${this.angle.value()}deg)
            "></div>
        </main>`;
    }

}

const demoView = new DemoView();
document.body.appendChild(demoView.node);
