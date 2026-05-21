pipeline{
    agent any
    stages{
        stage('build'){
            steps{
                sh "docker build -t v_app ."
            }
        }
        stage('testing'){
            steps{
                sh "docker run -p 3000:80 v_app"
                sleep time: 10, unit: 'SECONDS'
                sh "curl http://localhost:3000"
            }
        }
    }
}
