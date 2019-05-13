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
            end: 1.8,
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
            'font-family': 'system-ui, sans-serif',
            'max-width': '700px',
            'margin': '24px auto',
            'line-height': '1.5em',
            'h1': {
                'line-height': '1.5em',
            },
            '.box': {
                'height': '100px',
                'width': '100px',
                'background': 'turquoise',
                'box-shadow': '0 2px 6px -1px rgba(0, 0, 0, .3)',
                'border-radius': '4px',
            },
            'button': {
                'padding': '4px 8px',
                'font-size': '16px',
                'border-radius': '4px',
                'margin': '4px',
                'background': '#eee',
                'cursor': 'pointer',
            },
            'code': {
                'font-size': '1.3em',
                'background': '#eee',
                'padding': '3px 6px',
                'border-radius': '4px',
            },
        }
    }

    handleStartClick() {
        this.slideOut.play(1200, () => this.render()).then(result => {
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
        return jdom`<main>
            <h1><code>animated-value</code> demo</h1>

            <p>This is a simple demo of the <a href="https://github.com/thesephist/animated-value">animated-value</a> JavaScript library for rendering imperative animations in declarative UI frameworks. This demo is built with a UI framework called <a href="https://github.com/thesephist/torus">Torus</a>, but you can also use the library with most other declarative, component-based UI frameworks with class components.</p>

            <p>In this demo, we're animating five different properties -- opacity, x and y translations, scale, and rotation -- together as a single animation with <code>animated-value</code>. You can grab the code for this demo <a href="https://github.com/thesephist/animated-value/blob/master/demo/main.js">here.</a></p>

            <p>You can grab the npm package with <code>npm install animated-value</code> and read more at the link above.</p>

            <button  onclick="${this.handleStartClick}">
                Start animation
            </button>
            <button  onclick="${this.handlePauseClick}">
                Pause animation
            </button>
            <button onclick="${this.handleResumeClick}">
                Resume animation
            </button>
            <button onclick="${this.handleResetClick}">
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

class DemoDynamicView extends StyledComponent {

    init() {
        this._dest = 0;

        this.xPosition = new AnimatedValue.Dynamic({
            start: 0,
            stiffness: 6,
            damping: .2,
        });

        this.handleStartClick = this.handleStartClick.bind(this);
        this.handlePauseClick = this.handlePauseClick.bind(this);
        this.handleResumeClick = this.handleResumeClick.bind(this);
    }

    styles() {
        return {
            'font-family': 'system-ui, sans-serif',
            'max-width': '700px',
            'margin': '24px auto',
            'line-height': '1.5em',
            '.box': {
                'height': '100px',
                'width': '100px',
                'background': 'turquoise',
                'box-shadow': '0 2px 6px -1px rgba(0, 0, 0, .3)',
                'border-radius': '4px',
            },
            'button': {
                'padding': '4px 8px',
                'font-size': '16px',
                'border-radius': '4px',
                'margin': '4px',
                'background': '#eee',
                'cursor': 'pointer',
            },
            'code': {
                'font-size': '1.3em',
                'background': '#eee',
                'padding': '3px 6px',
                'border-radius': '4px',
            },
        }
    }

    handleStartClick() {
        this._dest = this._dest === 0 ? 300 : 0;
        this.xPosition.playTo(this._dest, () => this.render()).then(result => {
            console.log('Animation resolved to:', result);
        });
    }

    handlePauseClick() {
        this.xPosition.pause();
    }

    handleResumeClick() {
        this.xPosition.resume();
    }

    compose() {
        return jdom`<main>
            <p>In this demo, we're showing off the physics-based, spring-animation capabilities of <code>animated-value</code>. Dynamic animated values like this can be defined and controlled interactively and imperatively as well.</p>

            <p>You can also check out a more complex and completely interactive demo of physics-based animation in <a href="/dynamic.html">this demo page</a>.</p>

            <button  onclick="${this.handleStartClick}">
                Run animation
            </button>
            <button  onclick="${this.handlePauseClick}">
                Pause animation
            </button>
            <button onclick="${this.handleResumeClick}">
                Resume animation
            </button>
            <div class="box" style="
                transform: translate(${this.xPosition.value()}px);
            "></div>
        </main>`;
    }

}

const demoView = new DemoView();
const demoDynamicView = new DemoDynamicView();
document.body.appendChild(demoView.node);
document.body.appendChild(demoDynamicView.node);
