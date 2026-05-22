pipeline{
    agent any
    environment{
        IMAGE_NAME = "v_app"
        IMAGE_VERSION = "${BUILD_ID}"
    }
    stages{
        stage('build'){
            steps{
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_VERSION} ."
            }
        }
        stage('testing'){
            steps{
                sh "docker run -d -p 3000:80 --name dummy ${IMAGE_NAME}:${IMAGE_VERSION}"
                sleep time: 10, unit: 'SECONDS'
                sh "curl -f http://localhost:3000"
            }
            post{
                always{
                    sh "docker stop dummy"
                    sh "docker rm dummy"
                }
            }
        }
    }
}
