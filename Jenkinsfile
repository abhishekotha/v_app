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
                sh "docker network create testnet || true"
                sh "docker run -d --name dummy --network testnet ${IMAGE_NAME}:${IMAGE_VERSION}"
                sleep time: 10, unit: 'SECONDS'
                sh "docker run --rm --network testnet curlimages/curl curl -f http://dummy:80"
            }
        }
        stage("uploading"){
            steps{
                withCredentials([usernamePassword(
                    credentialsId : 'Docker_push_id',
                    usernameVariable : "USER",
                    passwordVariable : "PASS",
                )]){
                    sh "echo $PASS | docker login -u $USER --password-stdin"
                    sh "docker tag ${IMAGE_NAME}:${IMAGE_VERSION} $USER/${IMAGE_NAME}:${IMAGE_VERSION}"
                    sh "docker push $USER/${IMAGE_NAME}:${IMAGE_VERSION}"
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
