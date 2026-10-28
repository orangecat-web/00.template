import { mountPortfolioApp } from './services/portfolio.js'
import ProjectApp from './ProjectApp.vue'
import './assets/sass/shared.sass'
import './assets/sass/main.sass'

mountPortfolioApp(ProjectApp)
