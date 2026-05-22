pipeline{
    agent any
    environment{
        IMAGE_NAME = "V_APP"
        IMAGE_VERSION = credentials(VERSION)
    }
    stages{
        stage("testing"){
            steps{
                echo "Testing"
                sh "echo ${IMAGE_VERSION} ${IMAGE_NAME}"
            }
        }
        // stage('build'){
        //     steps{
        //         sh "docker build -t v_app ."
        //     }
        // }
        // stage('testing'){
        //     steps{
        //         sh "docker run -d -p 3000:80 --name v_app_container v_app"
        //         sleep time: 10, unit: 'SECONDS'
        //         sh "curl http://localhost:3000"
        //     }
        // }
    }
}
