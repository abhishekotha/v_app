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
                script{
                    def ip = sh(
                        script: "docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' dummy",
                        returnStdout: true
                    ).trim()
                    sh "curl -f http://${ip}:80"
                }

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
