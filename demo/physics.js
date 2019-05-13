const {
    StyledComponent,
} = Torus;

class DemoView extends StyledComponent {

    init() {
        this.xPosition = new AnimatedValue.Dynamic({
            start: 0,
            end: 500,
            stiffness: 3,
            damping: .9,
        });
        this.yPosition = new AnimatedValue.Dynamic({
            start: 0,
            end: 500,
            stiffness: 3,
            damping: .9,
        });

        this.handleStartClick = this.handleStartClick.bind(this);
        this.handlePlayClick = this.handlePlayClick.bind(this);
    }

    styles() {
        const extraStyles = css`
        .playArea {
            width: 100%;
            height: 500px;
            background: #eee;
            position: relative;
            .box {
                position: absolute;
                top: 0;
                left: 0;
            }
        }
        `;
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
            ...extraStyles,
        }
    }

    handleStartClick() {
        this.xPosition.play(2000, () => this.render());
        this.yPosition.play(2000, () => this.render());
    }

    handlePlayClick(evt) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const rect = this.node.querySelector('.playArea').getBoundingClientRect();
                this.xPosition.setEnd(evt.clientX - rect.left - 50);
                this.yPosition.setEnd(evt.clientY - rect.top - 50);
            });
        });
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
            <div class="playArea" onclick="${this.handlePlayClick}">
                <div class="box" style="
                    transform: translate(${this.xPosition.value()}px, ${this.yPosition.value()}px);
                "></div>
            </div>
        </main>`;
    }

}

const demoView = new DemoView();
document.body.appendChild(demoView.node);
