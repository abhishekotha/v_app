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
                sleep(10)
                sh "curl http://localhost:3000"
            }
        }
    }
}