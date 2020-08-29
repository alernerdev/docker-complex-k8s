# need to uniquely bump up version numbers because if its simply tagged as 'latest', kubernetes
# will think that its already running latest -- and will not bring down the update
# git log
# git rev-parse HEAD  -- gives you unique atomic number of the snapshot
# git checkout atomicnumber -- gives you the exact source code snapshot thats been deployed

echo "About to run deploy.sh"
echo "GIT_SHA is " $GIT_SHA

# tag images with 2 tags
docker build -t redridinghood/docker-complex-fib-client:latest -t redridinghood/docker-complex-fib-client:$GIT_SHA -f ./client/Dockerfile ./client
docker build -t redridinghood/docker-complex-fib-worker:latest -t redridinghood/docker-complex-fib-worker:$GIT_SHA -f ./worker/Dockerfile ./worker
docker build -t redridinghood/docker-complex-fib-server:latest -t redridinghood/docker-complex-fib-server:$GIT_SHA -f ./server/Dockerfile ./server

# push it up to dockerhub
docker push redridinghood/docker-complex-fib-client:latest
docker push redridinghood/docker-complex-fib-server:latest
docker push redridinghood/docker-complex-fib-worker:latest
docker push redridinghood/docker-complex-fib-client:$GIT_SHA
docker push redridinghood/docker-complex-fib-worker:$GIT_SHA
docker push redridinghood/docker-complex-fib-server:$GIT_SHA

kubectl apply -f k8s
kubectl set image deployments/server-deployment server=redridinghood/docker-complex-fib-server:$GIT_SHA
kubectl set image deployments/client-deployment client=redridinghood/docker-complex-fib-client:$GIT_SHA
kubectl set image deployments/worker-deployment worker=redridinghood/docker-complex-fib-worker:$GIT_SHA